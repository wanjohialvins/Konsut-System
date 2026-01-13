// Invoice & Quotation Creator
import { DocumentEngine } from "../utils/DocumentEngine";
import { SequenceManager } from "../utils/SequenceManager";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { generateInvoicePDF } from "../utils/pdfGenerator";
import { getInvoiceSettings } from "../utils/config";
import {
  FaPlus,
  FaMinus,
  FaSearch,
  FaTrash,
  FaSave,
  FaFilePdf,
  FaExchangeAlt,
  FaSeedling,
  FaEraser,
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaInfoCircle
} from "react-icons/fa";

import { useAuth } from "../contexts/AuthContext";
import { FiBox, FiTruck, FiTool } from "react-icons/fi";
import { useToast } from "../contexts/ToastContext";
import { api } from "../services/api";

// Types
import type { Invoice, InvoiceType, InvoiceItem as InvoiceLine, Product, Customer } from "../types/types";

type Category = "products" | "mobilization" | "services";
type StockItemWithCategory = Product & { type: Category };

// Constants
const DRAFT_KEY = "konsut_newinvoice_draft_vFinal";
const INVOICES_KEY = "invoices";
const USD_TO_KSH_KEY = "usdToKshRate";

const NewInvoice: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // --- Inventory State ---
  // Loaded from localStorage to populate the selection lists.
  const [products, setProducts] = useState<Product[]>([]);
  const [mobilization, setMobilization] = useState<Product[]>([]);
  const [services, setServices] = useState<Product[]>([]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const clientIdParam = searchParams.get("clientId");
  const isEditing = !!editId;

  // -- State --
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<Category>("products");
  const [activeDocumentType, setActiveDocumentType] = useState<InvoiceType>("quotation"); // NEW: Document Type

  const [search, setSearch] = useState<Record<Category, string>>({
    products: "",
    mobilization: "",
    services: "",
  });

  // Customer (auto-generate Customer ID)
  const [customerId, setCustomerId] = useState<string>(() => `CUST-${Math.floor(100000 + Math.random() * 900000)}`);
  const [customerName, setCustomerName] = useState<string>("Cash Customer");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("Nairobi, Kenya");
  const [customerKraPin, setCustomerKraPin] = useState<string>("P000000000A"); // NEW: KRA PIN
  const [displayCurrency, setDisplayCurrency] = useState<"Ksh" | "USD">("Ksh");

  // Due date input: user picks a date; daysRemaining auto-calculated
  const todayISO = new Date().toISOString().slice(0, 10);
  const [issuedDate, setIssuedDate] = useState<string>(todayISO);
  const [dueDate, setDueDate] = useState<string>("");

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});



  // Toggles
  const [usdToKshRate, setUsdToKshRate] = useState<number>(() => {
    const s = localStorage.getItem(USD_TO_KSH_KEY);
    return s ? Number(s) : 130;
  });

  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);
  const [includeDescriptionsInPDF, setIncludeDescriptionsInPDF] = useState<boolean>(true);

  // Custom PDF Sections
  const [includeClientResponsibilities, setIncludeClientResponsibilities] = useState<boolean>(false);
  const [clientResponsibilities, setClientResponsibilities] = useState<string>("1. Provide clear access to the site.\n2. Ensure power and water availability during installation.\n3. Approve final design before work commences.\n4. Secure necessary permits from local authorities.");

  const [includeTermsAndConditions, setIncludeTermsAndConditions] = useState<boolean>(false);
  const [termsAndConditions, setTermsAndConditions] = useState<string>("1. 60% deposit required to commence work.\n2. Balance due upon completion.\n3. Goods remain property of KONSUT LTD until paid in full.\n4. Warranty covers manufacturing defects only.");

  // Invoice lines
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [selectedId, setSelectedId] = useState<Record<Category, string>>({
    products: "",
    mobilization: "",
    services: "",
  });
  const [selectedQty, setSelectedQty] = useState<Record<Category, number>>({
    products: 1,
    mobilization: 1,
    services: 1,
  });

  // --- Global Item Search State ---
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  const allStockItems: StockItemWithCategory[] = useMemo(() => {
    return [
      ...products.map(p => ({ ...p, type: 'products' as const })),
      ...mobilization.map(p => ({ ...p, type: 'mobilization' as const })),
      ...services.map(p => ({ ...p, type: 'services' as const }))
    ];
  }, [products, mobilization, services]);

  const filteredStock = useMemo(() => {
    if (!itemSearch) return [];
    const lower = itemSearch.toLowerCase();
    return allStockItems.filter(i =>
      i.name.toLowerCase().includes(lower) ||
      (i.description && i.description.toLowerCase().includes(lower))
    ).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10);
  }, [itemSearch, allStockItems]);

  const handleSearchSelect = (item: StockItemWithCategory) => {
    // Switch category context to the item's category
    setActiveCategory(item.type);
    setSelectedId(prev => ({ ...prev, [item.type]: item.id }));

    // Reset search
    setIsSearchMode(false);
    setItemSearch("");
  };



  // Load data - Migrated to API
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Load settings & stock in parallel
      const [settings, stockData] = await Promise.all([
        api.settings.get(),
        api.stock.getAll()
      ]);

      if (settings?.invoiceSettings) {
        if (settings.invoiceSettings.currencyRate) {
          setUsdToKshRate(Number(settings.invoiceSettings.currencyRate));
        }

        // SYNC: Update localStorage so pdfGenerator.ts (which reads from LS) is in sync with Cloud Settings
        localStorage.setItem('invoiceSettings', JSON.stringify(settings.invoiceSettings));
        if (settings.company) {
          localStorage.setItem('company', JSON.stringify(settings.company));
        }

        // Apply defaults from settings if creating new invoice
        if (!isEditing && !clientIdParam) {
          if (settings.invoiceSettings.termsAndConditions) {
            setTermsAndConditions(settings.invoiceSettings.termsAndConditions);
          }
          if (settings.invoiceSettings.includeTerms !== undefined) {
            setIncludeTermsAndConditions(settings.invoiceSettings.includeTerms);
          }
        }
      }

      if (stockData) {
        // Map Backend (unitPrice) -> Frontend (priceKsh)
        const mappedStock: Product[] = stockData.map((s: any) => ({
          ...s,
          id: String(s.id || ''),
          name: String(s.name || ''),
          category: String(s.category || ''),
          description: typeof s.description === 'string' ? s.description : undefined,
          priceKsh: Number(s.unitPrice || s.unit_price || 0),
          priceUSD: Number(s.unitPriceUsd || s.unit_price_usd || 0)
        }));

        setProducts(mappedStock.filter((i) => i.category === 'products'));
        setMobilization(mappedStock.filter((i) => i.category === 'mobilization'));
        setServices(mappedStock.filter((i) => i.category === 'services'));
      }

      // 2. Load Document Data (Edit Mode OR Draft)
      if (isEditing && editId) {
        const invoiceToEdit = await api.invoices.getOne(editId) as Invoice;
        if (invoiceToEdit) {
          showToast("info", `Loaded ${invoiceToEdit.type} ${invoiceToEdit.id}`);
          setActiveDocumentType(invoiceToEdit.type);

          const customer = {
            id: invoiceToEdit.customer?.id || '',
            name: invoiceToEdit.customer?.name || '',
            phone: invoiceToEdit.customer?.phone || '',
            email: invoiceToEdit.customer?.email || '',
            address: invoiceToEdit.customer?.address || '',
            kraPin: invoiceToEdit.customer?.kraPin || ''
          };

          setCustomerId(customer.id);
          setCustomerName(customer.name);
          setCustomerPhone(customer.phone);
          setCustomerEmail(customer.email);
          setCustomerAddress(customer.address);
          setCustomerKraPin(customer.kraPin);
          setIssuedDate(invoiceToEdit.issuedDate);
          setDueDate(invoiceToEdit.dueDate || invoiceToEdit.quotationValidUntil || "");
          setLines(invoiceToEdit.items || []);
          if (invoiceToEdit.currencyRate) setUsdToKshRate(invoiceToEdit.currencyRate);

          if (invoiceToEdit.clientResponsibilities) {
            setIncludeClientResponsibilities(true);
            setClientResponsibilities(invoiceToEdit.clientResponsibilities);
          }
          if (invoiceToEdit.termsAndConditions) {
            setIncludeTermsAndConditions(true);
            setTermsAndConditions(invoiceToEdit.termsAndConditions);
          }
        }
      } else if (clientIdParam) {
        const clients = await api.clients.getAll();
        const client = clients.find((c: Customer) => c.id === clientIdParam);
        if (client) {
          setCustomerId(client.id);
          setCustomerName(client.name);
          setCustomerPhone(client.phone);
          setCustomerEmail(client.email);
          setCustomerAddress(client.address);
          setCustomerKraPin(client.kraPin || "");
        }
      } else {
        // Load Draft from LocalStorage (Drafts stay local)
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          try {
            const d = JSON.parse(savedDraft);
            if (d.customerId) setCustomerId(d.customerId);
            if (d.customerName) setCustomerName(d.customerName);
            if (d.customerPhone) setCustomerPhone(d.customerPhone);
            if (d.customerEmail) setCustomerEmail(d.customerEmail);
            if (d.customerAddress) setCustomerAddress(d.customerAddress);
            if (d.customerKraPin) setCustomerKraPin(d.customerKraPin);
            if (d.issuedDate) setIssuedDate(d.issuedDate);
            if (d.dueDate) setDueDate(d.dueDate);
            if (d.lines) setLines(d.lines);
            if (d.activeDocumentType) setActiveDocumentType(d.activeDocumentType);
          } catch (e) {
            console.warn("Draft parse failed", e);
          }
        }
      }
    } catch (error) {
      console.error("Initial load failed:", error);
      showToast('error', 'Failed to load initial data from cloud');
    } finally {
      setLoading(false);
    }
  }, [editId, isEditing, clientIdParam, showToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Save draft
  const saveAllData = useCallback((additionalData: Record<string, unknown> = {}) => {
    const dataToSave = {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerKraPin,
      issuedDate,
      dueDate,
      lines,
      showDescriptions,
      includeDescriptionsInPDF,
      usdToKshRate,
      activeDocumentType,
      includeClientResponsibilities,
      clientResponsibilities,
      includeTermsAndConditions,
      termsAndConditions,
      ...additionalData,
      lastSaved: new Date().toISOString()
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(USD_TO_KSH_KEY, String(usdToKshRate));
      return true;
    } catch (e) {
      console.error("Failed to save data:", e);
      return false;
    }
  }, [customerId, customerName, customerPhone, customerEmail, customerAddress, customerKraPin, issuedDate, dueDate, lines, showDescriptions, includeDescriptionsInPDF, usdToKshRate, activeDocumentType, includeClientResponsibilities, clientResponsibilities, includeTermsAndConditions, termsAndConditions]);

  /* ----------------------------
     Auto-save on data changes
     ---------------------------- */
  useEffect(() => {
    saveAllData();
  }, [saveAllData]);

  // Validation
  const validateCustomerInfo = () => {
    const errors: Record<string, string> = {};

    // Name is always required
    if (!customerName.trim()) {
      errors.customerName = "Customer name is required";
    }

    // KRA PIN required only for Proforma and Invoice
    if ((activeDocumentType === 'proforma' || activeDocumentType === 'invoice') && !customerKraPin.trim()) {
      errors.customerKraPin = "KRA PIN is required for Proforma and Invoice";
    }

    // Phone, Email, and Due Date are optional for all document types

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ----------------------------
     Helpers: category array + filtered
     ---------------------------- */
  const getCategoryArray = (cat: Category) =>
    cat === "products" ? products : cat === "mobilization" ? mobilization : services;

  const getFilteredForCategory = (cat: Category) => {
    const arr = getCategoryArray(cat);
    const q = (search[cat] || "").trim().toLowerCase();
    if (!q) return arr;
    return arr.filter((p) => p.name.toLowerCase().includes(q));
  };

  /* ----------------------------
     Add item from active category
     ---------------------------- */
  const handleAddSelected = (cat: Category) => {
    const id = selectedId[cat];
    const qty = Math.max(1, Math.floor(selectedQty[cat] || 1));
    if (!id) {
      showToast("error", "Select an item first");
      return;
    }
    const arr = getCategoryArray(cat);
    const prod = arr.find((p) => p.id === id);
    if (!prod) {
      showToast("error", "Selected item not found in stock");
      return;
    }

    const unitKsh = prod.priceKsh != null ? Number(prod.priceKsh) : prod.priceUSD != null ? Number(prod.priceUSD) * usdToKshRate : 0;

    const existingIndex = lines.findIndex((l) => l.id === id && l.category === cat);
    if (existingIndex >= 0) {
      const updated = [...lines];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].lineTotal = updated[existingIndex].unitPrice * updated[existingIndex].quantity;
      setLines(updated);
    } else {
      const newLine: InvoiceLine = {
        id: prod.id,
        name: prod.name,
        category: cat,
        description: showDescriptions ? prod.description ?? "" : undefined,
        quantity: qty,
        unitPrice: Number(unitKsh),
        lineTotal: Number(unitKsh) * qty,
      };
      setLines((s) => [...s, newLine]);
    }

    // reset selection for category
    setSelectedId((s) => ({ ...s, [cat]: "" }));
    setSelectedQty((q) => ({ ...q, [cat]: 1 }));
    showToast("success", "Item added");
  };

  /* ----------------------------
     Quantity controls (increment/decrement)
     ---------------------------- */
  const increaseQty = (index: number) => {
    const updated = [...lines];
    updated[index].quantity += 1;
    updated[index].lineTotal = updated[index].unitPrice * updated[index].quantity;
    setLines(updated);
  };

  const decreaseQty = (index: number) => {
    const updated = [...lines];
    updated[index].quantity = Math.max(1, updated[index].quantity - 1);
    updated[index].lineTotal = updated[index].unitPrice * updated[index].quantity;
    setLines(updated);
  };

  const removeLine = (index: number) => {
    if (!confirm("Remove this line?")) return;
    setLines((s) => s.filter((_, i) => i !== index));
    showToast("info", "Line removed");
  }



  // Finalize / Save to DB
  const saveDocument = async () => {
    if (!validateCustomerInfo()) {
      showToast("error", "Please fix validation errors");
      return;
    }

    if (lines.length === 0) {
      showToast("error", "Add at least one item");
      return;
    }

    setLoading(true);
    try {
      let docId = editId;
      if (!docId) {
        docId = SequenceManager.getNextNumber(activeDocumentType);
      }

      const invSettings = getInvoiceSettings();
      const { subtotal: calcSubtotal, taxAmount, grandTotal: calcGrandTotal } = DocumentEngine.calculateTotals(lines, invSettings.taxRate, invSettings.includeTax);

      const invoiceObj: Invoice = {
        id: docId,
        type: activeDocumentType,
        date: new Date().toISOString(),
        issuedDate,
        dueDate: dueDate || "",
        quotationValidUntil: activeDocumentType === 'quotation' ? dueDate : undefined,
        customer: { id: customerId, name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress, kraPin: customerKraPin },
        items: lines,
        subtotal: calcSubtotal,
        grandTotal: calcGrandTotal,
        tax: taxAmount,
        currencyRate: usdToKshRate,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientResponsibilities: includeClientResponsibilities ? clientResponsibilities : undefined,
        termsAndConditions: includeTermsAndConditions ? termsAndConditions : undefined,
      };

      if (isEditing) {
        await api.invoices.update(invoiceObj);
      } else {
        await api.invoices.create(invoiceObj);
      }

      showToast("success", `${activeDocumentType.charAt(0).toUpperCase() + activeDocumentType.slice(1)} ${docId} saved to cloud`);
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/new-invoice?id=${invoiceObj.id}&type=${activeDocumentType}`, { replace: true });
    } catch (e) {
      console.error("Failed to save document:", e);
      showToast("error", "Failed to save to cloud");
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    if (!validateCustomerInfo()) {
      showToast("error", "Please fix validation errors");
      return;
    }

    if (lines.length === 0) {
      showToast("error", "Add at least one item");
      return;
    }

    try {
      // 1. Prepare Data Object
      // Use existing ID if available, otherwise generate ONE time (and save it??)
      // Ideally, we should save before generating PDF to lock the number.
      let finalId = editId;
      if (!finalId) {
        finalId = SequenceManager.getNextNumber(activeDocumentType);
        // Update URL/State to reflect this new ID so we don't burn another one next time
        // This requires navigating or state update.
        // For now, let's just use it for the PDF.
        // BEST PRACTICE: Auto-save the document with this new ID.
        // We will allow the PDF to be generated with the new ID.
      }

      const invSettings = getInvoiceSettings();
      const { subtotal: calcSubtotal, taxAmount, grandTotal: calcGrandTotal } = DocumentEngine.calculateTotals(lines, invSettings.taxRate, invSettings.includeTax);

      const invoiceData = {
        id: finalId,
        type: activeDocumentType,
        date: new Date().toISOString(),
        issuedDate,
        dueDate: dueDate || "",
        customer: {
          id: customerId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          kraPin: customerKraPin
        },
        items: lines,
        subtotal: calcSubtotal,
        tax: taxAmount,
        grandTotal: calcGrandTotal,
        currencyRate: usdToKshRate,
        status: "draft" as const,
        clientResponsibilities: includeClientResponsibilities ? clientResponsibilities : undefined,
        termsAndConditions: includeTermsAndConditions ? termsAndConditions : undefined,
      };

      // Auto-save logic - Migrated to API
      const invoiceObjForSave: Invoice = {
        ...invoiceData,
        quotationValidUntil: activeDocumentType === 'quotation' ? dueDate : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await api.invoices.update(invoiceObjForSave);
      } else {
        await api.invoices.create(invoiceObjForSave);
      }

      const pdfDocType: "INVOICE" | "QUOTATION" | "PROFORMA" = activeDocumentType === 'quotation' ? 'QUOTATION'
        : activeDocumentType === 'proforma' ? 'PROFORMA'
          : 'INVOICE';

      await generateInvoicePDF(
        invoiceData as Invoice, // Cast to Invoice
        pdfDocType,
        {
          includeDescriptions: includeDescriptionsInPDF,
          currency: displayCurrency
        }
      );

      const filenameDate = new Date().toISOString().split('T')[0];
      const filename = `${pdfDocType} ${invoiceData.id}, for ${customerName} at ${filenameDate}.pdf`;

      // Save PDF generation record
      const pdfRecord = {
        fileName: filename,
        quoteNumber: invoiceData.id,
        generatedAt: new Date().toISOString(),
        customerName,
        totalAmount: grandTotal,
        itemCount: lines.length
      };

      // Save to PDF history
      const pdfHistory = JSON.parse(localStorage.getItem("konsut_pdf_history") || "[]");
      pdfHistory.unshift(pdfRecord);
      localStorage.setItem("konsut_pdf_history", JSON.stringify(pdfHistory.slice(0, 50))); // Keep last 50

      // Save current state with PDF info
      saveAllData({
        action: "generate_pdf",
        pdfFileName: pdfRecord.fileName,
        quoteNumber: invoiceData.id,
        timestamp: new Date().toISOString()
      });

      showToast("success", "PDF generated and saved successfully");
    } catch (err) {
      console.error("PDF generation failed:", err);
      showToast("error", "PDF generation failed. See console for details");
    }
  };

  /* ----------------------------
     Dev helper: seed sample stock
     ---------------------------- */
  /* ----------------------------
     Dev helper: seed sample stock - Cloud migration: use Stock page for this
     ---------------------------- */
  const seedSampleStock = () => {
    showToast("info", "Stock seeding is now handled in the Stock page");
  };

  /* ----------------------------
     Handle Clear Stock - Cloud migration: use Stock page for this
     ---------------------------- */
  const handleClearStock = () => {
    showToast("info", "Stock clearing is now handled in the Stock page");
  };

  /* ----------------------------
     Calculations for UI Display
     ---------------------------- */
  const { subtotal, grandTotal } = useMemo(() => {
    const settings = getInvoiceSettings();
    return DocumentEngine.calculateTotals(lines, settings.taxRate, settings.includeTax);
  }, [lines]);

  const displaySubtotal = displayCurrency === "USD"
    ? (subtotal / usdToKshRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const displayGrandTotal = displayCurrency === "USD"
    ? (grandTotal / usdToKshRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ----------------------------
     Handle Convert (Unidirectional Workflow)
     ---------------------------- */
  const handleConvert = async (targetType: InvoiceType) => {
    if (!confirm(`Convert this ${activeDocumentType} to ${targetType}? This will create a NEW document.`)) return;

    try {
      if (!validateCustomerInfo() || lines.length === 0) {
        showToast("error", "Please complete the form first");
        return;
      }

      // Preserve ID suffix logic: QUO-123 -> PRO-123
      let newId = SequenceManager.getNextNumber(targetType);

      if (editId) {
        const parts = editId.split('-');
        if (parts.length > 1) {
          const suffix = parts.slice(1).join('-');
          // Determine prefix based on target type
          const prefix = targetType === 'quotation' ? 'QUO' : targetType === 'proforma' ? 'PRO' : 'INV';
          newId = `${prefix}-${suffix}`;
        }
      }

      const { subtotal: calcSubtotal, taxAmount, grandTotal: calcGrandTotal } = DocumentEngine.calculateTotals(lines);

      const newInvoice: Invoice = {
        id: newId,
        type: targetType,
        date: new Date().toISOString(),
        issuedDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || "", // Carry over due date? Or reset? Usually carry over or reset. Let's keep it.
        quotationValidUntil: targetType === 'quotation' ? dueDate : undefined,
        customer: {
          id: customerId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          kraPin: customerKraPin
        },
        items: lines,
        subtotal: calcSubtotal,
        grandTotal: calcGrandTotal,
        tax: taxAmount,
        currencyRate: usdToKshRate,
        status: "draft",
        convertedFrom: editId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientResponsibilities: includeClientResponsibilities ? clientResponsibilities : undefined,
        termsAndConditions: includeTermsAndConditions ? termsAndConditions : undefined,
      };

      // Save to backend
      await api.invoices.create(newInvoice);

      showToast("success", `Converted to ${targetType}`);

      // Navigate to new document
      setTimeout(() => {
        navigate(`/new-invoice?id=${newId}&type=${targetType}`);
        window.location.reload(); // Force reload to pick up new ID cleanly
      }, 500);

    } catch (e) {
      console.error("Conversion failed:", e);
      showToast("error", "Conversion failed");
    }
  };

  /* ----------------------------
     Render Component
     ---------------------------- */
  const Toolbar = () => (
    <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none mb-8 border border-gray-100 dark:border-midnight-800 flex flex-col gap-6 animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        {/* Title & Type Toggles */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
              {isEditing ? `Edit ${activeDocumentType}` : `New ${activeDocumentType}`}
              {editId && <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-midnight-800 px-3 py-1 rounded-full border border-gray-200 dark:border-midnight-700">#{editId}</span>}
            </h1>
          </div>

          {/* Mobile Action Buttons (Visible only on mobile) */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={saveDocument} title="Save Draft" className="p-3 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <FaSave />
            </button>
            <button onClick={generatePDF} title="Download PDF" className="p-3 rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
              <FaFilePdf />
            </button>
          </div>
        </div>

        {/* Search & Desktop Actions */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative group w-full md:w-80">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder={`Search ${activeCategory}...`}
              value={search[activeCategory]}
              onChange={(e) => setSearch((s) => ({ ...s, [activeCategory]: e.target.value }))}
              className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl py-3 pl-10 pr-4 font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-400 shadow-inner"
            />
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {/* ADMIN ONLY: Stock Tools */}
            {user?.role === 'admin' && (
              <>
                <button onClick={handleClearStock} title="Clear all stock items" className="px-5 py-3 rounded-xl bg-white dark:bg-midnight-800 border border-red-100 dark:border-red-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all shadow-sm">
                  <FaEraser size={14} /> Clear Stock
                </button>
                <button onClick={seedSampleStock} title="Add sample stock items" className="px-5 py-3 rounded-xl bg-white dark:bg-midnight-800 border border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all shadow-sm">
                  <FaSeedling size={14} /> Seed Stock
                </button>
              </>
            )}

            {/* Workflow Actions */}
            {activeDocumentType === 'quotation' && isEditing && (
              <button
                onClick={() => handleConvert('proforma')}
                title="Convert to Proforma Invoice"
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20 transform hover:scale-105"
              >
                <FaExchangeAlt size={14} /> Convert
              </button>
            )}

            {activeDocumentType === 'proforma' && isEditing && (
              <button
                onClick={() => handleConvert('invoice')}
                title="Convert to Final Invoice"
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20 transform hover:scale-105"
              >
                <FaExchangeAlt size={14} /> Convert
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-brand-600 font-bold animate-pulse">Loading Editor...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-midnight-950 min-h-screen font-sans text-slate-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        <Toolbar />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT: Customer & Items */}
          <div className="xl:col-span-2 space-y-8 animate-slide-up delay-200">
            {/* Customer Details */}
            <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400"><FaUser /></div>
                Customer Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Full Name</label>
                  <input
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white ${validationErrors.customerName ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10" : ""}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Phone Number</label>
                  <input
                    placeholder="+254 7..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white ${validationErrors.customerPhone ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10" : ""}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Email Address</label>
                  <input
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className={`w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white ${validationErrors.customerEmail ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10" : ""}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Physical Address</label>
                  <input
                    placeholder="Location..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">KRA PIN</label>
                  <input
                    placeholder="P0..."
                    value={customerKraPin}
                    onChange={(e) => setCustomerKraPin(e.target.value)}
                    className={`w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white ${validationErrors.customerKraPin ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10" : ""}`}
                  />
                  {validationErrors.customerKraPin && <span className="text-xs font-bold text-red-500 mt-1 block">{validationErrors.customerKraPin}</span>}
                </div>

                {/* Dates */}
                <div className="md:col-span-2 grid grid-cols-2 gap-6 mt-2 pt-6 border-t border-gray-100 dark:border-midnight-800">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Issued Date</span>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="w-full bg-gray-50 dark:bg-midnight-950 border-none pl-12 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-700 dark:text-gray-300" />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">
                      {activeDocumentType === 'quotation' ? 'Valid Until' : 'Due Date'}
                    </span>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`w-full bg-gray-50 dark:bg-midnight-950 border-none pl-12 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-700 dark:text-gray-300 ${validationErrors.dueDate ? "ring-2 ring-red-500" : ""}`} />
                    </div>
                    {validationErrors.dueDate && <span className="text-xs font-bold text-red-500 mt-1 block">{validationErrors.dueDate}</span>}
                  </label>
                </div>
              </div>
            </div>

            {/* Inventory Selector */}
            <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400"><FiBox /></div>
                Add Items
              </h2>

              {/* Category Tabs */}
              <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { id: 'products', label: 'Products', icon: FiBox, color: 'brand' },
                  { id: 'mobilization', label: 'Mobilization', icon: FiTruck, color: 'purple' },
                  { id: 'services', label: 'Services', icon: FiTool, color: 'orange' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as Category)}
                    className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${activeCategory === cat.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg transform scale-105'
                      : 'bg-gray-50 dark:bg-midnight-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-midnight-700'
                      }`}
                  >
                    <cat.icon /> {cat.label}
                  </button>
                ))}
              </div>

              {/* Selection Row */}
              <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-midnight-950 p-6 rounded-2xl border border-gray-100 dark:border-midnight-800">
                <div className="flex-1 w-full relative">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isSearchMode ? "Search Database" : "Select Item"}</label>
                    <button
                      onClick={() => { setIsSearchMode(!isSearchMode); setItemSearch(""); }}
                      className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${isSearchMode ? 'text-rose-500 hover:text-rose-600' : 'text-brand-600 hover:text-brand-700'}`}
                    >
                      {isSearchMode ? <><FaTimes /> Cancel</> : <><FaSearch /> Search All</>}
                    </button>
                  </div>

                  {!isSearchMode ? (
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white dark:bg-midnight-900 border-none p-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-800 dark:text-white shadow-sm transition-all cursor-pointer"
                        value={selectedId[activeCategory]}
                        onChange={(e) => setSelectedId((s) => ({ ...s, [activeCategory]: e.target.value }))}
                      >
                        <option value="">-- Choose {activeCategory} --</option>
                        {getFilteredForCategory(activeCategory).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.priceKsh ? `Ksh ${p.priceKsh}` : `USD ${p.priceUSD}`})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        autoFocus
                        className="w-full bg-white dark:bg-midnight-900 border-2 border-brand-500 p-4 rounded-xl outline-none shadow-lg font-bold text-gray-800 dark:text-white"
                        placeholder="Type name or description..."
                        value={itemSearch}
                        onChange={e => setItemSearch(e.target.value)}
                      />
                      {/* Results Dropdown */}
                      {itemSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto w-full animate-fade-in custom-scrollbar">
                          {filteredStock.length === 0 ? (
                            <div className="p-4 text-xs font-bold text-gray-400 text-center uppercase tracking-wide">No items found</div>
                          ) : (
                            filteredStock.map(item => (
                              <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => handleSearchSelect(item)}
                                className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-midnight-800 border-b border-gray-50 dark:border-midnight-800 last:border-0 flex justify-between items-center group transition-colors"
                              >
                                <div>
                                  <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    {item.name}
                                    <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${item.type === 'products' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                      item.type === 'services' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                      }`}>
                                      {item.type}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] mt-0.5">{item.description}</div>
                                </div>
                                <div className="text-xs font-black text-gray-600 dark:text-gray-300 whitespace-nowrap ml-2 bg-gray-100 dark:bg-midnight-950 px-2 py-1 rounded-lg">
                                  {item.priceKsh ? `Ksh ${item.priceKsh.toLocaleString()}` : `USD ${item.priceUSD?.toLocaleString()}`}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-24">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Qty</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-white dark:bg-midnight-900 border-none p-4 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-brand-500 dark:text-white shadow-sm"
                    value={selectedQty[activeCategory]}
                    onChange={(e) => setSelectedQty((q) => ({ ...q, [activeCategory]: Number(e.target.value) }))}
                  />
                </div>

                <button
                  onClick={() => handleAddSelected(activeCategory)}
                  title="Add Selected Item"
                  className="w-full md:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
                >
                  <FaPlus /> Add
                </button>
              </div>
            </div>

            {/* Selected Items Table */}
            <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 overflow-hidden">
              <div className="p-6 bg-gray-50/50 dark:bg-midnight-950/50 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center">
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Line Items <span className="text-gray-400 ml-2 text-sm font-bold">({lines.length})</span></h3>
                <button
                  onClick={() => setIncludeDescriptionsInPDF(!includeDescriptionsInPDF)}
                  className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border transition-colors ${includeDescriptionsInPDF ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-midnight-800 border-gray-200 dark:border-midnight-700 text-gray-500 dark:text-gray-400'}`}
                >
                  {includeDescriptionsInPDF ? 'PDF: With Desc' : 'PDF: Compact'}
                </button>
              </div>

              {lines.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-medium italic">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-midnight-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-midnight-700">
                    <FiBox size={24} />
                  </div>
                  No items added yet. Select items above to populate the invoice.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-midnight-950 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="p-6">Item</th>
                        <th className="p-6 text-center">Qty</th>
                        <th className="p-6 text-right">Price</th>
                        <th className="p-6 text-right">Total</th>
                        <th className="p-6 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                      {lines.map((item, idx) => (
                        <tr key={`${item.id}-${idx}`} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                          <td className="p-6">
                            <div className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</div>
                            {showDescriptions && item.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 font-medium">{item.description}</div>
                            )}
                          </td>
                          <td className="p-6">
                            <div className="flex items-center justify-center gap-3 bg-gray-50 dark:bg-midnight-950 rounded-lg p-1 w-fit mx-auto">
                              <button onClick={() => decreaseQty(idx)} className="p-1 hover:bg-white dark:hover:bg-midnight-800 rounded shadow-sm text-gray-500 hover:text-red-500 transition-all"><FaMinus size={8} /></button>
                              <span className="w-6 text-center font-bold text-sm text-gray-700 dark:text-gray-200">{item.quantity}</span>
                              <button onClick={() => increaseQty(idx)} className="p-1 hover:bg-white dark:hover:bg-midnight-800 rounded shadow-sm text-gray-500 hover:text-emerald-500 transition-all"><FaPlus size={8} /></button>
                            </div>
                          </td>
                          <td className="p-6 text-right font-medium text-gray-600 dark:text-gray-300 text-sm">
                            {displayCurrency === "USD"
                              ? `$${(item.unitPrice / usdToKshRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                              : (item.unitPrice || 0).toLocaleString()
                            }
                          </td>
                          <td className="p-6 text-right font-black text-gray-900 dark:text-white text-sm">
                            {displayCurrency === "USD"
                              ? `$${(item.lineTotal / usdToKshRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                              : (item.lineTotal || 0).toLocaleString()
                            }
                          </td>
                          <td className="p-6 text-center">
                            <button onClick={() => removeLine(idx)} title="Remove Item" className="text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-lg transition-colors">
                              <FaTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Custom Notes Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
                <label className="flex items-center gap-3 font-bold text-gray-700 dark:text-gray-200 mb-4 cursor-pointer select-none">
                  <input type="checkbox" checked={includeClientResponsibilities} onChange={(e) => setIncludeClientResponsibilities(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5" />
                  <span className="text-sm font-black uppercase tracking-wide">Client Responsibilities</span>
                </label>
                {includeClientResponsibilities && (
                  <textarea
                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-4 text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none shadow-inner"
                    rows={4}
                    value={clientResponsibilities}
                    onChange={(e) => setClientResponsibilities(e.target.value)}
                    placeholder="Enter client responsibilities..."
                  />
                )}
              </div>

              <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
                <label className="flex items-center gap-3 font-bold text-gray-700 dark:text-gray-200 mb-4 cursor-pointer select-none">
                  <input type="checkbox" checked={includeTermsAndConditions} onChange={(e) => setIncludeTermsAndConditions(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5" />
                  <span className="text-sm font-black uppercase tracking-wide">Terms & Conditions</span>
                </label>
                {includeTermsAndConditions && (
                  <textarea
                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-4 text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none shadow-inner"
                    rows={4}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="Enter T&Cs..."
                  />
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: Summary & Settings */}
          <div className="space-y-6 animate-slide-up delay-300">
            {/* Summary Card */}
            <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-midnight-800 sticky top-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                <span>Quote Summary</span>
                <FaInfoCircle className="text-gray-300" />
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-bold">
                  <span>Subtotal</span>
                  <span className="text-gray-900 dark:text-white">{displayCurrency === "USD" ? "$" : "Ksh"} {displaySubtotal}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-bold">
                  <span>VAT (16%)</span>
                  <span className="text-gray-400">-</span>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-gray-100 dark:border-midnight-800 flex justify-between items-center mt-2">
                  <span className="font-black text-xl text-gray-900 dark:text-white">Total</span>
                  <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">{displayCurrency === "USD" ? "$" : "Ksh"} {displayGrandTotal}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={saveDocument} title="Save Document" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]">
                  <FaSave size={16} /> Save Document
                </button>

                <button onClick={generatePDF} title="Generate and Download PDF" className="w-full py-4 bg-white dark:bg-midnight-800 border-2 border-brand-100 dark:border-midnight-700 text-brand-600 dark:text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-brand-50 dark:hover:bg-midnight-700 transition-all flex items-center justify-center gap-3">
                  <FaFilePdf size={16} /> Download PDF
                </button>
              </div>

              {/* Settings Toggles in Summary */}
              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-midnight-800 space-y-6">

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Display Currency</span>
                  <button
                    onClick={() => setDisplayCurrency(c => c === "Ksh" ? "USD" : "Ksh")}
                    title="Toggle Currency"
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-gray-100 dark:bg-midnight-950 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-midnight-800 transition-colors flex items-center gap-2"
                  >
                    <FaExchangeAlt /> {displayCurrency}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Exchange Rate (1 USD = ? Ksh)</label>
                  <input
                    type="number"
                    value={usdToKshRate}
                    onChange={(e) => setUsdToKshRate(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-3 rounded-xl text-sm font-bold text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-midnight-950 rounded-xl">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 pl-2">Show Descriptions</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" checked={showDescriptions} onChange={(e) => setShowDescriptions(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5" />
                    <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${showDescriptions ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'}`}></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInvoice;
