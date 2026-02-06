import { DocumentEngine } from "../../utils/DocumentEngine";
import { SequenceManager } from "../../utils/SequenceManager";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { SmartTextarea } from "../../components/ui/SmartGuide";

import { generateInvoicePDF } from "../../utils/pdfGenerator";
import { getInvoiceSettings } from "../../utils/config";
import {
  FaSave,
  FaFilePdf,
  FaExchangeAlt,

  FaEraser,
  FaSearch,
  FaTimes
} from "react-icons/fa";

import { useAuth } from "../../contexts/AuthContext";
import { FiBox } from "react-icons/fi";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../services/api";
import { useModal } from "../../contexts/ModalContext";
import PDFPreviewModal from "../../components/modals/PDFPreviewModal";
import { usePDFPreview } from "../../hooks/usePDFPreview";
import InvoiceForm from "../../components/new-invoice/InvoiceForm";
import LineItemsTable from "../../components/new-invoice/LineItemsTable";
import InvoiceSummary from "../../components/new-invoice/InvoiceSummary";
import InventorySelector from "../../components/new-invoice/InventorySelector";
import { DashboardSkeleton } from "../../components/skeletons/CommonSkeletons";
import SavingIndicator from "../../components/ui/SavingIndicator";
import { useAutoSave } from "../../hooks/useAutoSave";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

// Types
import { DEFAULT_CURRENCY_RATE } from "../../utils/config";
import type { Invoice, InvoiceType, InvoiceItem as InvoiceLine, Product, Customer, Category } from "../../types/types";

// Constants
const DRAFT_KEY = "konsut_newinvoice_draft_vFinal";
const USD_TO_KSH_KEY = "usdToKshRate";

/**
 * Document creation engine for Quotations, Proformas, and Invoices.
 */
const NewInvoice: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [mobilization, setMobilization] = useState<Product[]>([]);
  const [services, setServices] = useState<Product[]>([]);

  // --- Navigation & Routing ---
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const clientIdParam = searchParams.get("clientId");
  const isEditing = !!editId;

  // --- Core State ---
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<Category>("products");
  const [activeDocumentType, setActiveDocumentType] = useState<InvoiceType>(() => {
    const typeParam = searchParams.get("type");
    return (typeParam as InvoiceType) || "quotation";
  });

  const { previewUrl, previewTitle, previewInvoiceData, closePreview } = usePDFPreview();

  // Quick Stock Add Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [newStockItem, setNewStockItem] = useState<{ name: string, price: number, category: Category, description: string }>({
    name: "",
    price: 0,
    category: "products",
    description: ""
  });

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

  const todayISO = new Date().toISOString().slice(0, 10);
  const [issuedDate, setIssuedDate] = useState<string>(todayISO);
  const [dueDate, setDueDate] = useState<string>("");

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});



  // Toggles
  const [usdToKshRate, setUsdToKshRate] = useState<number>(() => {
    const s = localStorage.getItem(USD_TO_KSH_KEY);
    return s ? Number(s) : DEFAULT_CURRENCY_RATE;
  });

  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);
  const [includeDescriptionsInPDF, setIncludeDescriptionsInPDF] = useState<boolean>(true);

  // Custom PDF Sections
  const [includeClientResponsibilities, setIncludeClientResponsibilities] = useState<boolean>(true);
  const [clientResponsibilities, setClientResponsibilities] = useState<string>("1. Provide clear access to the site.\n2. Ensure power and water availability during installation.\n3. Approve final design before work commences.\n4. Secure necessary permits from local authorities.");

  const [includeTermsAndConditions, setIncludeTermsAndConditions] = useState<boolean>(true);
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

  const allStockItems: Product[] = useMemo(() => {
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

  const handleSearchSelect = (item: Product) => {
    // Switch category context to the item's category
    const cat = item.type || 'products';
    setActiveCategory(cat);
    setSelectedId(prev => ({ ...prev, [cat]: item.id }));

    // Reset search
    setIsSearchMode(false);
    setItemSearch("");
  };



  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

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
          if (settings.invoiceSettings.clientResponsibilities) {
            setClientResponsibilities(settings.invoiceSettings.clientResponsibilities);
          }
          if (settings.invoiceSettings.includeClientResponsibilities !== undefined) {
            setIncludeClientResponsibilities(settings.invoiceSettings.includeClientResponsibilities);
          }
        }
      }

      if (stockData) {
        // Map Backend (unitPrice) -> Frontend (priceKsh)
        const mappedStock: Product[] = stockData.map((s: Record<string, any>) => ({
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
          // DATE FIX: safely parse dates
          const safeDate = (d: string | undefined): string => {
            if (!d) return "";
            try {
              return d.includes('T') ? d.split('T')[0] : d;
            } catch {
              return "";
            }
          };

          setIssuedDate(safeDate(invoiceToEdit.issuedDate) || new Date().toISOString().split('T')[0]);
          setDueDate(safeDate(invoiceToEdit.dueDate) || safeDate(invoiceToEdit.quotationValidUntil) || "");
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
          } catch {
            console.warn("Draft parse failed");
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

  /* ----------------------------
     Auto-save on data changes
     ---------------------------- */
  const isOnline = useOnlineStatus();

  const autoSaveData = useMemo(() => ({
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
    lastSaved: new Date().toISOString()
  }), [customerId, customerName, customerPhone, customerEmail, customerAddress, customerKraPin, issuedDate, dueDate, lines, showDescriptions, includeDescriptionsInPDF, usdToKshRate, activeDocumentType, includeClientResponsibilities, clientResponsibilities, includeTermsAndConditions, termsAndConditions]);

  const isSaving = useAutoSave(DRAFT_KEY, autoSaveData, 1500);

  // Validation

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
    setLines((prevLines) => {
      const updated = [...prevLines];
      const item = { ...updated[index] };
      item.quantity += 1;
      const discount = item.discount || 0;
      item.lineTotal = (item.unitPrice * item.quantity) - discount;
      updated[index] = item;
      return updated;
    });
  };

  const decreaseQty = (index: number) => {
    setLines((prevLines) => {
      const updated = [...prevLines];
      const item = { ...updated[index] };
      item.quantity = Math.max(1, item.quantity - 1);
      const discount = item.discount || 0;
      item.lineTotal = (item.unitPrice * item.quantity) - discount;
      updated[index] = item;
      return updated;
    });
  };

  const updateLineItem = (index: number, field: keyof InvoiceLine, value: any) => {
    setLines((prevLines) => {
      const updated = [...prevLines];
      const item = { ...updated[index] };
      (item as any)[field] = value;
      updated[index] = item;
      return updated;
    });
  };

  const removeLine = async (index: number) => {
    const confirmed = await showConfirm("Remove this line?");
    if (!confirmed) return;
    setLines((s) => s.filter((_, i) => i !== index));
    showToast("info", "Line removed");
  }

  const moveLine = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === lines.length - 1)) return;
    const newLines = [...lines];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newLines[index], newLines[targetIndex]] = [newLines[targetIndex], newLines[index]];
    setLines(newLines);
  };



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
        docId = await SequenceManager.getNextNumber(activeDocumentType);
      }

      const invSettings = getInvoiceSettings();
      const { subtotal: calcSubtotal, totalDiscount: calcTotalDiscount, taxAmount, grandTotal: calcGrandTotal } = DocumentEngine.calculateTotals(lines, invSettings.taxRate, invSettings.includeTax);

      const invoiceObj: Invoice = {
        id: docId,
        type: activeDocumentType,
        date: new Date().toISOString(),
        issuedDate,
        dueDate: dueDate || undefined,
        quotationValidUntil: activeDocumentType === 'quotation' ? (dueDate || undefined) : undefined,
        customer: { id: customerId, name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress, kraPin: customerKraPin },
        items: lines,
        subtotal: calcSubtotal,
        totalDiscount: calcTotalDiscount,
        tax: taxAmount,
        taxAmount: taxAmount, // Added for backend compatibility
        currency: "Ksh", // Added for backend compatibility
        grandTotal: calcGrandTotal,
        currencyRate: usdToKshRate,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientResponsibilities: includeClientResponsibilities ? clientResponsibilities : undefined,
        termsAndConditions: includeTermsAndConditions ? termsAndConditions : undefined,
      };

      let res;
      if (isEditing) {
        res = await api.invoices.update(invoiceObj);
      } else {
        res = await api.invoices.create(invoiceObj);
      }

      if (res && res.clientUpdated) {
        showToast('info', 'ℹ️ Client contact info updated in registry');
      }

      showToast("success", `${activeDocumentType.charAt(0).toUpperCase() + activeDocumentType.slice(1)} ${docId} saved to cloud`);
      localStorage.removeItem(DRAFT_KEY);

      // Update local state immediately to matching ID to prevent race conditions during navigation
      setLoading(false); // Ensure loading is off

      // Navigate to list view on success
      navigate('/invoices');
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to save to cloud';
      showToast("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (lines.length === 0) return showToast("error", "Add items first");
    const invSettings = getInvoiceSettings();
    const { subtotal: calcSubtotal, totalDiscount: calcTotalDiscount, taxAmount, grandTotal: calcGrandTotal } = DocumentEngine.calculateTotals(lines, invSettings.taxRate, invSettings.includeTax);

    const previewData = {
      id: editId || "PREVIEW",
      type: activeDocumentType,
      date: new Date().toISOString(),
      issuedDate,
      dueDate,
      customer: { id: customerId, name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress, kraPin: customerKraPin },
      items: lines,
      subtotal: calcSubtotal,
      totalDiscount: calcTotalDiscount,
      taxAmount,
      grandTotal: calcGrandTotal,
      currencyRate: usdToKshRate,
      clientResponsibilities: includeClientResponsibilities ? clientResponsibilities : undefined,
      termsAndConditions: includeTermsAndConditions ? termsAndConditions : undefined,
    } as Invoice;

    await previewInvoiceData(previewData, activeDocumentType, {
      includeDescriptions: includeDescriptionsInPDF,
      currency: displayCurrency
    });
  };

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
      // Use existing ID if available, otherwise generate ONE time
      let finalId = editId;
      let isNewId = false;

      if (!finalId) {
        // Fix: Peek at the next number but don't burn it yet. 
        // We only "consume" it from SequenceManager if the save is successful.
        finalId = await SequenceManager.peekNextNumber(activeDocumentType);
        isNewId = true;
      }

      const invSettings = getInvoiceSettings();
      const { subtotal: calcSubtotal, totalDiscount: calcTotalDiscount, taxAmount, grandTotal: calcGrandTotal } = DocumentEngine.calculateTotals(lines, invSettings.taxRate, invSettings.includeTax);

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
        totalDiscount: calcTotalDiscount,
        tax: taxAmount,
        taxAmount: taxAmount,
        grandTotal: calcGrandTotal,
        currency: displayCurrency,
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

        // CRITICAL: Successfully saved new invoice, so now we strictly consume the sequence number.
        if (isNewId) {
          await SequenceManager.getNextNumber(activeDocumentType);
          // Also update URL to reflect new ID (optional but good UX)
          // navigate(`?id=${finalId}&type=${activeDocumentType}`, { replace: true });
        }
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
      // Handled by autoSaveData memo if needed, otherwise manual LS update for transient flags
      localStorage.setItem(`${DRAFT_KEY}_last_pdf_action`, JSON.stringify({
        action: "generate_pdf",
        pdfFileName: pdfRecord.fileName,
        quoteNumber: invoiceData.id,
        timestamp: new Date().toISOString()
      }));

      showToast("success", "PDF generated and saved successfully");
    } catch {
      showToast("error", "PDF generation failed. See console for details");
    }
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
  const { subtotal, totalDiscount, grandTotal } = useMemo(() => {
    const settings = getInvoiceSettings();
    return DocumentEngine.calculateTotals(lines, settings.taxRate, settings.includeTax);
  }, [lines]);

  const displaySubtotal = displayCurrency === "USD"
    ? (subtotal / usdToKshRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const displayGrandTotal = displayCurrency === "USD"
    ? (grandTotal / usdToKshRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /**
   * Converts the current document to a different type (e.g., Quotation -> Invoice).
   * 
   * Workflow:
   * 1. Validates current data.
   * 2. Preserves the ID suffix logic (QUO-001 -> INV-001) for consistency.
   * 3. Creates a NEW database record for the target type.
   * 4. Redirects the user to the new document.
   * 
   * @param targetType The type of document to convert to
   */
  const handleConvert = async (targetType: InvoiceType) => {
    const confirmed = await showConfirm(`Convert this ${activeDocumentType} to ${targetType}? This will create a NEW document.`);
    if (!confirmed) return;

    try {
      if (!validateCustomerInfo() || lines.length === 0) {
        showToast("error", "Please complete the form first");
        return;
      }

      // Preserve ID suffix logic: QUO-123 -> PRO-123
      let newId = await SequenceManager.getNextNumber(targetType);

      if (editId) {
        const parts = editId.split('-');
        if (parts.length > 1) {
          const suffix = parts.slice(1).join('-');
          // Determine prefix based on target type
          const prefix = targetType === 'quotation' ? 'QUO' : targetType === 'proforma' ? 'PRO' : 'INV';
          newId = `${prefix}-${suffix}`;
        }
      }

      const { subtotal: calcSubtotal, totalDiscount: calcTotalDiscount, taxAmount, grandTotal: calcGrandTotal } = DocumentEngine.calculateTotals(lines);

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
        totalDiscount: calcTotalDiscount,
        tax: taxAmount,
        taxAmount: taxAmount, // Added for backend compatibility
        currency: "Ksh", // Added for backend compatibility
        grandTotal: calcGrandTotal,
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

    } catch {
      showToast("error", "Conversion failed");
    }
  };

  /* ----------------------------
     Stock Management Functions
     ---------------------------- */
  const handleSaveToStock = async (line: InvoiceLine) => {
    try {
      setLoading(true);
      const isNew = line.id.startsWith('TEMP-');
      const payload = {
        id: isNew ? undefined : line.id,
        name: line.name,
        category: line.category,
        description: line.description,
        unitPrice: line.unitPrice,
        quantity: 0 // Don't affect quantity when just saving info
      };

      if (isNew) {
        await api.stock.create(payload as Product);
        showToast('success', 'Added to stock library');
      } else {
        await api.stock.update(payload as Product);
        showToast('success', 'Stock description updated');
      }

      // Refresh stock data silently
      const stockData = await api.stock.getAll();
      if (stockData) {
        const mappedStock: Product[] = stockData.map((s: Record<string, any>) => ({
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
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save to stock');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomItem = (name: string) => {
    const tempId = `TEMP-${Date.now()}`;
    const newLine: InvoiceLine = {
      id: tempId,
      name: name,
      category: activeCategory,
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
      description: ''
    };
    setLines(prev => [...prev, newLine]);
    setIsSearchMode(false);
    setItemSearch("");
    showToast('info', 'Custom item added. Set price and click "+" to save to stock.');
  };

  const handleQuickAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newStockItem.name.trim()) return showToast('error', 'Name is required');
      setLoading(true);

      const payload = {
        id: '',
        name: newStockItem.name,
        category: newStockItem.category,
        description: newStockItem.description,
        unitPrice: newStockItem.price, // KSH (Maps to 'unitPrice' column)
        unitPriceUsd: newStockItem.price > 0 ? (newStockItem.price / usdToKshRate) : 0, // Auto-calc USD
        quantity: 0
      };

      // Map for API payload structure if needed, but api.stock.create handles Product
      await api.stock.create(payload as any);

      showToast('success', 'Stock item created successfully');
      setIsStockModalOpen(false);
      setNewStockItem({ name: "", price: 0, category: "products", description: "" });

      // Refresh stock
      const stockData = await api.stock.getAll();
      if (stockData) {
        const mappedStock: Product[] = stockData.map((s: Record<string, any>) => ({
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

    } catch (e: any) {
      showToast('error', e.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------
     Render Component
     ---------------------------- */

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-midnight-950 min-h-screen font-sans text-slate-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        {/* Quick Add Stock Modal */}
        {isStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-midnight-800 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-700 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <FiBox /> Quick Add Stock
                </h2>
                <button onClick={() => setIsStockModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-white transition-colors">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleQuickAddStock} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Item Name</label>
                  <input
                    value={newStockItem.name}
                    onChange={e => setNewStockItem({ ...newStockItem, name: e.target.value })}
                    required
                    placeholder="E.g. Wireless Mouse"
                    className="w-full bg-gray-50 dark:bg-midnight-900 border border-gray-200 dark:border-midnight-700 rounded-xl p-3 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Category</label>
                    <select
                      value={newStockItem.category}
                      onChange={e => setNewStockItem({ ...newStockItem, category: e.target.value as Category })}
                      className="w-full bg-gray-50 dark:bg-midnight-900 border border-gray-200 dark:border-midnight-700 rounded-xl p-3 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                    >
                      <option value="products">Products</option>
                      <option value="mobilization">Mobilization</option>
                      <option value="services">Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Price (Ksh)</label>
                    <input
                      type="number"
                      value={newStockItem.price}
                      onChange={e => setNewStockItem({ ...newStockItem, price: Number(e.target.value) })}
                      min="0"
                      className="w-full bg-gray-50 dark:bg-midnight-900 border border-gray-200 dark:border-midnight-700 rounded-xl p-3 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                </div>


                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Description</label>
                  <textarea
                    value={newStockItem.description}
                    onChange={e => setNewStockItem({ ...newStockItem, description: e.target.value })}
                    rows={3}
                    placeholder="Optional details..."
                    className="w-full bg-gray-50 dark:bg-midnight-900 border border-gray-200 dark:border-midnight-700 rounded-xl p-3 font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                  />
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-500/30 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add to Inventory'}
                </button>
              </form>
            </div>
          </div>
        )}

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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT: Customer & Items */}
          <div className="xl:col-span-2 space-y-8 animate-slide-up delay-200">
            {/* Customer Details */}
            <div id="invoice-customer-select">
              <InvoiceForm
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
                customerAddress={customerAddress}
                setCustomerAddress={setCustomerAddress}
                customerKraPin={customerKraPin}
                setCustomerKraPin={setCustomerKraPin}
                issuedDate={issuedDate}
                setIssuedDate={setIssuedDate}
                dueDate={dueDate}
                setDueDate={setDueDate}
                activeDocumentType={activeDocumentType}
                validationErrors={validationErrors}
              />
            </div>

            {/* Inventory Selector */}
            <InventorySelector
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              isSearchMode={isSearchMode}
              setIsSearchMode={setIsSearchMode}
              itemSearch={itemSearch}
              setItemSearch={setItemSearch}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              selectedQty={selectedQty}
              setSelectedQty={setSelectedQty}
              getFilteredForCategory={getFilteredForCategory}
              filteredStock={filteredStock}
              handleSearchSelect={handleSearchSelect}
              handleCreateCustomItem={handleCreateCustomItem}
              handleAddSelected={handleAddSelected}
            />

            {/* Selected Items Table */}
            <div id="invoice-line-items">
              <LineItemsTable
                lines={lines}
                showDescriptions={showDescriptions}
                onToggleDescriptions={() => setShowDescriptions(!showDescriptions)}
                includeDescriptionsInPDF={includeDescriptionsInPDF}
                onTogglePDFDescriptions={() => setIncludeDescriptionsInPDF(!includeDescriptionsInPDF)}
                displayCurrency={displayCurrency}
                usdToKshRate={usdToKshRate}
                user={user}
                onUpdateLineItem={updateLineItem}
                onIncreaseQty={increaseQty}
                onDecreaseQty={decreaseQty}
                onRemoveLine={removeLine}
                onMoveLine={moveLine}
                onSaveToStock={handleSaveToStock}
                setIsStockModalOpen={setIsStockModalOpen}
              />
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
            <div id="invoice-save-area">
              <InvoiceSummary
                subtotal={subtotal}
                totalDiscount={totalDiscount}
                grandTotal={grandTotal}
                displayCurrency={displayCurrency}
                setDisplayCurrency={setDisplayCurrency}
                usdToKshRate={usdToKshRate}
                setUsdToKshRate={setUsdToKshRate}
                showDescriptions={showDescriptions}
                setShowDescriptions={setShowDescriptions}
                onSave={saveDocument}
                onPreview={handlePreview}
                onDownload={generatePDF}
                isLoading={loading}
                isSaving={isSaving}
                isOffline={!isOnline}
                lastSaved={autoSaveData.lastSaved}
              />
            </div>
          </div>
        </div>

        <PDFPreviewModal
          isOpen={!!previewUrl}
          onClose={closePreview}
          pdfUrl={previewUrl}
          title={previewTitle}
        />
      </div >
    </div >
  );
};

export default NewInvoice;
