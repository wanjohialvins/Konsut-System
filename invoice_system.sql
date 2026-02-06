-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 06, 2026 at 10:05 AM
-- Server version: 10.11.16-MariaDB-log
-- PHP Version: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ivpitglf_invoice_system`
--
CREATE DATABASE IF NOT EXISTS `ivpitglf_invoice_system` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `ivpitglf_invoice_system`;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `details`, `timestamp`) VALUES
(1, 3, 'RECOVERY_LOGIN', 'Used recovery phrase from IP 102.219.208.90', '2026-02-05 00:02:21'),
(2, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:03:26'),
(3, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:03:26'),
(4, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:03:27'),
(5, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:03:27'),
(6, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:03:27'),
(7, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:03:27'),
(8, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:09:57'),
(9, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:09:57'),
(10, 12, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:32:45'),
(11, 12, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 00:32:46'),
(12, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 01:53:47'),
(13, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 01:53:47'),
(14, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 01:53:48'),
(15, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 01:54:02'),
(16, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 01:54:02'),
(17, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 01:54:02'),
(18, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 01:54:03'),
(19, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 02:38:45'),
(20, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 02:38:45'),
(21, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 02:39:17'),
(22, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 02:39:19'),
(23, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 10:28:26'),
(24, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 10:28:26'),
(25, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 10:28:26'),
(26, 3, 'SYSTEM_ACTION', 'Executed system action: purge-sessions', '2026-02-05 10:28:28'),
(27, 3, 'SYSTEM_ACTION', 'Executed system action: purge-logs', '2026-02-05 10:36:19'),
(28, 3, 'DEBUG_AUTH', 'Debugged login for user: Martin', '2026-02-05 10:36:44'),
(29, 3, 'DEBUG_AUTH', 'Debugged login for user: Martin', '2026-02-05 10:36:46'),
(30, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 10:36:49'),
(31, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 10:36:49'),
(32, 3, 'SYSTEM_ACTION', 'Executed system action: broadcast', '2026-02-05 10:37:16'),
(33, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 10:37:30'),
(34, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 10:39:32'),
(35, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 11:05:06'),
(36, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 11:05:06'),
(37, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 11:05:11'),
(38, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-05 11:05:16'),
(39, 3, 'SYSTEM_ACTION', 'Executed system action: purge-sessions', '2026-02-05 11:06:03'),
(40, 3, 'SYSTEM_ACTION', 'Executed system action: purge-sessions', '2026-02-05 11:06:17'),
(41, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-06 09:25:06'),
(42, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-06 09:25:06'),
(43, 3, 'DEBUG_AUTH', 'Debugged login for user: eragondevs', '2026-02-06 09:27:58'),
(44, 3, 'DEBUG_AUTH', 'Debugged login for user: eragondevs', '2026-02-06 09:28:01'),
(45, 3, 'DEBUG_AUTH', 'Debugged login for user: eragondevs', '2026-02-06 09:28:04'),
(46, 3, 'DEBUG_AUTH', 'Debugged login for user: eragondevs', '2026-02-06 09:28:05'),
(47, 3, 'SYSTEM_ACTION', 'Executed system action: sync', '2026-02-06 09:29:15'),
(48, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-06 09:29:21'),
(49, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-06 09:29:21'),
(50, 3, 'SYSTEM_ACTION', 'Executed system action: purge-logs', '2026-02-06 09:29:24'),
(51, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-06 10:00:31'),
(52, 3, 'SYSTEM_ACTION', 'Executed system action: get-active-users', '2026-02-06 10:00:31');

-- --------------------------------------------------------

--
-- Table structure for table `auth_tokens`
--

CREATE TABLE `auth_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_tokens`
--

INSERT INTO `auth_tokens` (`id`, `user_id`, `token`, `expires_at`, `created_at`) VALUES
(3, 3, '2c245236bdfd8f41dd158b8023d6d60d8aa9dc72e7a3f17bccb5a03bfdbff23c', '2026-03-07 02:23:08', '2026-02-05 02:23:08'),
(4, 3, 'ca8a96542c6767076a217e0c8e61c2c68223afaaad01b44a4d26cd89530c5308', '2026-03-07 02:29:46', '2026-02-05 02:29:46'),
(6, 3, '210b0c9846f8ebb48ee3cc293f232924019f4447d978644de95f92ffef40acb7', '2026-03-07 02:38:07', '2026-02-05 02:38:07'),
(9, 3, '6f2273cacc37f285431f121b6eb67e025584985538f220df132234f3a7eaa4e9', '2026-03-07 11:04:52', '2026-02-05 11:04:52'),
(10, 15, '46aa82807bfcac27edbe5664a3b05fefab8a9438b1b4fc25398653c8ae120595', '2026-03-07 11:06:32', '2026-02-05 11:06:32'),
(11, 16, '4000bb191b8f6d15c939becefd62e5b6b7700a04c670a6588b751ab4e4ef62f4', '2026-03-07 11:06:42', '2026-02-05 11:06:42'),
(12, 3, 'cced2b96f9722638caeeff06982f0b7b3f3d9fefec03370a44ed62186eb2dcbc', '2026-03-07 11:11:48', '2026-02-05 11:11:48'),
(13, 3, 'ec8992af53afed768caf2a3b3a74ec7cac52dfae80040f0d7e7e4191f404c98c', '2026-03-07 11:13:06', '2026-02-05 11:13:06'),
(14, 15, '2eff7fc1877444f0301ed8fdfdacd1e3247814c8869a9c8e5e75814359869f66', '2026-03-07 11:14:18', '2026-02-05 11:14:18'),
(15, 3, '54bf2dcbf50390373d170f9560fd8b12168cdc3f5bae45cb3b4fae0094b8b296', '2026-03-07 11:17:15', '2026-02-05 11:17:15'),
(16, 3, '2e4575d2cdd5565c54af8a868b8d4809e3b6913c43015085a3218ad68837f962', '2026-03-07 11:17:22', '2026-02-05 11:17:22'),
(17, 3, 'dbaea6d3f3e7eff0b9dc22de494129575ea8ec786ff313ed9f3896818e940363', '2026-03-07 11:17:27', '2026-02-05 11:17:27'),
(18, 3, '22ee27e40c5329e865060242e39c46909ff2d183449a5dcff363febcee2ff469', '2026-03-07 11:20:31', '2026-02-05 11:20:31'),
(19, 3, 'f39440a98ba41f1cd2c8824b9d32316d388e15ae36014c8f89b046cfddbbcb24', '2026-03-07 11:20:38', '2026-02-05 11:20:38'),
(20, 3, '1d3b0aa9bac5195b2fec603c4ee724dd214f01c35cf500983e241c8b9db665e3', '2026-03-07 11:22:13', '2026-02-05 11:22:13'),
(21, 3, '47b6a58b04cab089e839913260047c158f8cfc7c721d771ecf74b84fd798a0e1', '2026-03-07 18:36:05', '2026-02-05 18:36:05'),
(22, 15, '01538e0a7a6af4b9896cd3d609bb155439ee645e7f1bb0a2cef0f19504554a64', '2026-03-07 18:36:47', '2026-02-05 18:36:47'),
(23, 15, '244d95ff263a6232b5f656635b94fecb612567bda23e387c040f541685079b2b', '2026-03-07 20:13:51', '2026-02-05 20:13:51'),
(24, 15, '3b8affaaf9a43329ac1dcf5c054d04ae82595694cf00107b957dfa8b4153933d', '2026-03-07 20:14:00', '2026-02-05 20:14:00'),
(25, 3, '27d891425110e3aae045e03f79f0fc4e7167668f14be5a32ff9b0e55e11b5fcb', '2026-03-08 09:20:40', '2026-02-06 09:20:40'),
(26, 3, 'a3880d1cd7832f120c27243c8944efc8f711ec21b56f730435a4e657cdf684e9', '2026-03-08 09:23:57', '2026-02-06 09:23:57'),
(27, 15, '1d873e8fa885c85f7e272a4843fedc12fb758e5157af5b3285932aae8f307aae', '2026-03-08 09:30:37', '2026-02-06 09:30:37'),
(28, 3, '8493bfb754866ba3db15426da462f4ecb32352687aaead6d2d0696563f0cae7b', '2026-03-08 10:00:19', '2026-02-06 10:00:19');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `kraPin` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `address`, `kraPin`, `created_at`, `deleted_at`) VALUES
('CUST-364461', 'Cash Customer', 'wanjohialvins@gmail.com', '+254702965421', 'Nairobi, Kenya', 'P000000000A', '2026-02-05 00:04:54', NULL),
('CUST-978937', 'Alvins Wanjohi', 'wanjohialvins@gmail.com', '+254702965421', 'Nairobi, Kenya', 'P030045000A', '2026-02-06 10:01:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` varchar(50) NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `type` varchar(20) NOT NULL,
  `status` varchar(20) DEFAULT 'draft',
  `issuedDate` date DEFAULT NULL,
  `dueDate` date DEFAULT NULL,
  `quotationValidUntil` date DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'Ksh',
  `currencyRate` decimal(10,4) DEFAULT 1.0000,
  `subtotal` decimal(15,2) DEFAULT 0.00,
  `totalDiscount` decimal(15,2) DEFAULT 0.00,
  `taxAmount` decimal(15,2) DEFAULT 0.00,
  `grandTotal` decimal(15,2) DEFAULT 0.00,
  `clientResponsibilities` text DEFAULT NULL,
  `termsAndConditions` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `customer_id`, `type`, `status`, `issuedDate`, `dueDate`, `quotationValidUntil`, `currency`, `currencyRate`, `subtotal`, `taxAmount`, `grandTotal`, `clientResponsibilities`, `termsAndConditions`, `created_by`, `created_at`, `deleted_at`) VALUES
('QUO-0205-01', 'CUST-364461', 'quotation', 'draft', '2026-02-05', '2026-02-20', '2026-02-20', 'Ksh', 130.0000, 7800.00, 1248.00, 9048.00, '1. Provide clear access to the site.\n2. Ensure power and water availability during installation.\n3. Approve final design before work commences.\n4. Secure necessary permits from local authorities.', '1. 60% deposit required to commence work.\n2. Balance due upon completion.\n3. Goods remain property of KONSUT LTD until paid in full.\n4. Warranty covers manufacturing defects only.', 3, '2026-02-05 00:04:54', NULL),
('QUO-0206-01', 'CUST-978937', 'quotation', 'draft', '2026-02-06', '2026-02-26', '2026-02-26', 'Ksh', 130.0000, 7629.70, 1220.75, 8850.45, '1. Provide clear access to the site.\n2. Ensure power and water availability during installation.\n3. Approve final design before work commences.\n4. Secure necessary permits from local authorities.', '1. 60% deposit required to commence work.\n2. Balance due upon completion.\n3. Goods remain property of KONSUT LTD until paid in full.\n4. Warranty covers manufacturing defects only.', 3, '2026-02-06 10:01:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `document_items`
--

CREATE TABLE `document_items` (
  `id` int(11) NOT NULL,
  `document_id` varchar(50) NOT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `unitPrice` decimal(15,2) DEFAULT 0.00,
  `discount` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_items`
--

INSERT INTO `document_items` (`id`, `document_id`, `product_id`, `name`, `description`, `quantity`, `unitPrice`, `total`) VALUES
(1, 'QUO-0205-01', 'P-BSGW', 'Full-motion (Swivel ) Tv Wall Mount Suitable for 43-80 inch', '', 1, 7800.00, 7800.00),
(2, 'QUO-0206-01', 'P-RPDR', 'HDMI Fiber Optic Cable 20 meter 4K', '', 1, 7499.70, 7499.70),
(3, 'QUO-0206-01', 'P-OPY2', 'fIBER GLASS SHELTER', '', 1, 130.00, 130.00);

-- --------------------------------------------------------

--
-- Table structure for table `login_history`
--

CREATE TABLE `login_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `login_time` datetime DEFAULT current_timestamp(),
  `ip_address` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_history`
--

INSERT INTO `login_history` (`id`, `user_id`, `login_time`, `ip_address`) VALUES
(87, 3, '2026-02-05 00:02:21', '102.219.208.90'),
(97, 15, '2026-02-05 01:14:50', '102.219.208.90'),
(98, 15, '2026-02-05 02:20:56', '102.219.208.90'),
(99, 15, '2026-02-05 02:22:49', '102.219.208.90'),
(100, 3, '2026-02-05 02:23:08', '102.219.208.90'),
(101, 3, '2026-02-05 02:29:46', '102.219.208.90'),
(102, 16, '2026-02-05 02:33:03', '102.219.208.90'),
(103, 3, '2026-02-05 02:38:07', '102.219.208.90'),
(104, 15, '2026-02-05 10:28:53', '102.219.208.90'),
(105, 15, '2026-02-05 10:38:20', '102.219.208.90'),
(106, 3, '2026-02-05 11:04:52', '102.219.208.90'),
(107, 15, '2026-02-05 11:06:32', '102.219.208.90'),
(108, 16, '2026-02-05 11:06:42', '102.219.208.90'),
(109, 3, '2026-02-05 11:11:48', '102.219.208.90'),
(110, 3, '2026-02-05 11:13:06', '102.219.208.90'),
(111, 15, '2026-02-05 11:14:18', '102.219.208.90'),
(112, 3, '2026-02-05 11:17:15', '102.219.208.90'),
(113, 3, '2026-02-05 11:17:22', '102.219.208.90'),
(114, 3, '2026-02-05 11:17:27', '102.219.208.90'),
(115, 3, '2026-02-05 11:20:31', '102.219.208.90'),
(116, 3, '2026-02-05 11:20:38', '102.219.208.90'),
(117, 3, '2026-02-05 11:22:13', '102.219.208.90'),
(118, 3, '2026-02-05 18:36:05', '102.219.208.90'),
(119, 15, '2026-02-05 18:36:47', '102.219.208.90'),
(120, 15, '2026-02-05 20:13:51', '105.161.239.226'),
(121, 15, '2026-02-05 20:14:00', '105.161.239.226'),
(122, 3, '2026-02-06 09:20:40', '102.219.208.90'),
(123, 3, '2026-02-06 09:23:57', '102.219.208.90'),
(124, 15, '2026-02-06 09:30:37', '102.219.208.90'),
(125, 3, '2026-02-06 10:00:19', '102.219.208.90');

-- --------------------------------------------------------

--
-- Table structure for table `memos`
--

CREATE TABLE `memos` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `urgent` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `type` varchar(50) DEFAULT 'info',
  `read_status` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sequences`
--

CREATE TABLE `sequences` (
  `type` varchar(20) NOT NULL,
  `current_value` int(11) DEFAULT 0,
  `last_reset_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sequences`
--

INSERT INTO `sequences` (`type`, `current_value`, `last_reset_date`) VALUES
('quotation', 1, '2026-02-06');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`setting_value`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('preferences', '{\"theme\":\"light\",\"uiDensity\":\"spacious\",\"accentColor\":\"purple\"}'),
('system_maintenance', 'false');

-- --------------------------------------------------------

--
-- Table structure for table `stock`
--

CREATE TABLE `stock` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `unitPrice` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unitPriceUsd` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock`
--

INSERT INTO `stock` (`id`, `name`, `description`, `category`, `unitPrice`, `unitPriceUsd`, `quantity`, `created_at`, `deleted_at`) VALUES
('', 'wireless mosue', 'sdfsf', 'products', 544.00, 4.18, 0, '2026-02-05 01:29:50', NULL),
('P-09BB', 'Motorola IMPRES Remote Speaker Microphone', '', 'products', 20800.00, 160.00, 1, '2026-01-31 19:29:45', NULL),
('P-09NF', 'AIRBAND ANTENNA', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:45', NULL),
('P-0F7Q', 'N FEMALE RG58', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-0PMG', 'N FEMALE RG213', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-1N8W', 'BNC Connector RG58', '', 'products', 754.00, 5.80, 1, '2026-01-31 19:29:44', NULL),
('P-2C61', 'DP1400', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-4LDZ', 'DUPLEXER & CABLES TAILS', '', 'products', 65000.00, 500.00, 1, '2026-01-31 19:29:44', NULL),
('P-6XEB', 'SITE SURVEY', '', 'services', 9999.60, 76.92, 1, '2026-01-31 19:29:45', NULL),
('P-6XNI', 'MOBILE ANTTENNA  1/4 WAVE BADLANDS', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:45', NULL),
('P-7ITA', '4*4 CAR HIRE', '', 'mobilization', 9100.00, 70.00, 1, '2026-01-31 19:29:45', NULL),
('P-8HEQ', 'RG213 50 OHM Coaxial cable', '', 'products', 780.00, 6.00, 1, '2026-01-31 19:29:45', NULL),
('P-9VL1', 'FUEL', '', 'mobilization', 13260.00, 102.00, 1, '2026-01-31 19:29:45', NULL),
('P-BAHV', 'PL 259 MALE connector RG213', '', 'products', 780.00, 6.00, 1, '2026-01-31 19:29:44', NULL),
('P-BSGW', 'Full-motion (Swivel ) Tv Wall Mount Suitable for 43-80 inch', '', 'products', 7800.00, 60.00, 1, '2026-01-31 19:29:45', NULL),
('P-DIUA', 'SKILLED TECHNICAL LABOUR TEAM DAILY RATE', '', 'services', 30000.10, 230.77, 1, '2026-01-31 19:29:45', NULL),
('P-E05C', 'RF CABLE LMR PER M', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-E38N', '50 inch LG UHD AI UA80 4K Smart TV HDR10 webOS25 2025', '', 'products', 69999.80, 538.46, 1, '2026-01-31 19:29:45', NULL),
('P-ED2J', 'RG58 50 OHM Coaxial cable per Meter', '', 'products', 650.00, 5.00, 1, '2026-01-31 19:29:45', NULL),
('P-ENFF', 'WALL MOUNTED KEY SAFE BOX CABINET 160 HOOKS', '', 'products', 4999.80, 38.46, 1, '2026-01-31 19:29:45', NULL),
('P-HSWX', 'SLR5500 Repeater', '', 'products', 390000.00, 3000.00, 1, '2026-01-31 19:29:44', NULL),
('P-IC6W', 'DM1400 DIGITAL', '', 'products', 20000.50, 153.85, 1, '2026-01-31 19:29:44', NULL),
('P-IGNE', 'DP4000/R7 MULTI CHARGER', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-IKXP', 'SUNDRIES (MATERIALS)', '', 'products', 30000.10, 230.77, 1, '2026-01-31 19:29:45', NULL),
('P-IO1M', 'MOBILE ANTTENNA ZARA', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:45', NULL),
('P-K5Q9', 'BASE RADIO ANTENNA VHF', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:45', NULL),
('P-KG03', 'RF CABLE RG213  50 Ohm PER M', '', 'products', 650.00, 5.00, 1, '2026-01-31 19:29:44', NULL),
('P-LDBK', 'R7 NON DISPLAY Premium', '', 'products', 91000.00, 700.00, 1, '2026-01-31 19:29:44', NULL),
('P-LQXY', 'N - BNC', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-MBOU', 'RG213 50 OHM Coaxial cable', '', 'products', 780.00, 6.00, 1, '2026-01-31 19:29:44', NULL),
('P-MPBM', 'RADIO PROGRAMMING AND CONFIG', '', 'services', 34999.90, 269.23, 1, '2026-01-31 19:29:45', NULL),
('P-NUPV', 'USER TRAINING AND HANDOVER', '', 'services', 34999.90, 269.23, 1, '2026-01-31 19:29:45', NULL),
('P-ODK3', 'BNC RG213', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-OPY2', 'fIBER GLASS SHELTER', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:45', NULL),
('P-PDJ0', 'WEDGE POWER SUPPLY', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-PLAB', 'DM4601E HP', '', 'products', 79430.00, 611.00, 1, '2026-01-31 19:29:43', NULL),
('P-RPDR', 'HDMI Fiber Optic Cable 20 meter 4K', '', 'products', 7499.70, 57.69, 1, '2026-01-31 19:29:45', NULL),
('P-RUBJ', 'PL 259 MALE connector RG58', '', 'products', 689.00, 5.30, 1, '2026-01-31 19:29:44', NULL),
('P-SD50', 'RF lightning surge protector', '', 'products', 18460.00, 142.00, 1, '2026-01-31 19:29:44', NULL),
('P-SPFH', 'N-TYPE CONNECTOR RG58', '', 'products', 600.60, 4.62, 1, '2026-01-31 19:29:44', NULL),
('P-T474', 'N-Type Connector MALE RG213', '', 'products', 1047.80, 8.06, 1, '2026-01-31 19:29:44', NULL),
('P-T52J', 'DM4401E HP', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-U4MF', 'DP4000 SINGLE CHARGER', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:44', NULL),
('P-UDY7', 'Earthing materials lot', '', 'products', 30000.10, 230.77, 1, '2026-01-31 19:29:45', NULL),
('P-VNYR', 'DM4600E HP', 'clear communication brought to you', 'products', 79430.00, 611.00, 1, '2026-01-31 19:29:43', NULL),
('P-XWDG', 'SYSTEM DESIGN AND ENGINEERING', '', 'services', 3250.00, 25.00, 1, '2026-01-31 19:29:45', NULL),
('P-Y129', 'R7 DISPLAY Premium', '', 'products', 107250.00, 825.00, 1, '2026-01-31 19:29:44', NULL),
('P-Y4A1', 'N-Type Connector MALE RG58', '', 'products', 899.60, 6.92, 1, '2026-01-31 19:29:44', NULL),
('P-YCEZ', 'DP4000 BATTERY IMPRESS 2100 MAH', '', 'products', 15654.60, 120.42, 1, '2026-01-31 19:29:44', NULL),
('P-YY4I', 'SENTINAL', '', 'products', 130.00, 1.00, 1, '2026-01-31 19:29:45', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `priority` varchar(20) DEFAULT 'medium',
  `status` varchar(20) DEFAULT 'pending',
  `due_date` datetime DEFAULT NULL,
  `assignee` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `assignee_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `title`, `priority`, `status`, `due_date`, `assignee`, `created_at`, `created_by`, `assignee_id`) VALUES
('TASK-1770258351090', 'dgdgd', 'low', 'pending', '2026-02-27 00:00:00', NULL, '2026-02-05 02:25:50', 3, 15);

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` varchar(50) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `user_id` int(11) NOT NULL,
  `category` varchar(50) DEFAULT 'general',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_messages`
--

CREATE TABLE `ticket_messages` (
  `id` int(11) NOT NULL,
  `ticket_id` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_internal` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'staff',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `last_login` datetime DEFAULT NULL,
  `last_active` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `force_password_change` tinyint(1) DEFAULT 0,
  `force_refresh` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `role`, `permissions`, `last_login`, `last_active`, `created_at`, `force_password_change`) VALUES
(3, 'eragondevs', '$2y$10$eYwlvvpm30Q3O9MmvHMA9O6cRy7nOVaGAqad2LVeR4r8p7eND/9DS', 'wanjohialvins@gmail.com', 'admin', '[\"\\/\",\"\\/new-invoice\",\"\\/invoices\",\"\\/clients\",\"\\/stock\\/inventory\",\"\\/stock\\/add\",\"\\/analytics\",\"\\/audit-logs\",\"\\/system-health\",\"\\/settings\\/profile\",\"\\/settings\\/invoice\",\"\\/settings\\/preferences\",\"\\/settings\\/system\",\"\\/users\",\"\\/support\"]', '2026-02-06 10:00:19', '2026-02-06 10:02:36', '2026-01-15 23:00:31', 0),
(11, 'IT Admin', '$2y$10$4upJEwWddc4lLXXTjijyh.qUhNvFripELuEeJndFQawpkKZZLC.H2', 'admin@konsut.com', 'it', '[\"\\/\",\"\\/users\",\"\\/audit-logs\",\"\\/system-health\",\"\\/settings\\/profile\",\"\\/settings\\/company\",\"\\/settings\\/invoice\",\"\\/settings\\/preferences\",\"\\/settings\\/system\",\"\\/notifications\",\"\\/support\",\"\\/documents\"]', '2026-01-23 12:56:35', '2026-01-23 12:56:47', '2026-01-19 08:55:21', 0),
(13, 'Data entry', '$2y$10$VF4mU5bicBT9VueqftchguYc7q5fARp9BICblblzqbESzocJv6OMW', 'data@konsut.com', 'storekeeper', '[\"\\/\",\"\\/tasks\",\"\\/memos\",\"\\/notifications\",\"\\/support\",\"\\/settings\\/profile\",\"\\/tickets\",\"\\/tickets\\/new\",\"manage_suppliers\",\"view_stock\",\"view_suppliers\",\"\\/stock\\/inventory\",\"\\/suppliers\",\"\\/settings\\/preferences\",\"\\/support\\/guide\"]', '2026-01-31 21:48:30', '2026-01-31 19:04:24', '2026-01-23 11:28:05', 0),
(15, 'konsut', '$2y$10$vy4tZGXkBLAfsX9K4wG8yO7Ks8xiFZ71SrYUu0QPUFW3mZZr9G0ZK', 'dennis@konsut.co.ke', 'ceo', '[\"\\/\",\"\\/analytics\",\"view_stock\",\"manage_stock\",\"\\/stock\\/inventory\",\"\\/stock\\/add\",\"view_orders\",\"create_order\",\"manage_invoices\",\"delete_invoice\",\"\\/invoices\",\"\\/new-invoice\",\"view_clients\",\"manage_clients\",\"delete_client\",\"\\/clients\",\"view_suppliers\",\"manage_suppliers\",\"\\/suppliers\",\"\\/documents\",\"manage_documents\",\"\\/tasks\",\"manage_tasks\",\"\\/memos\",\"manage_memos\",\"\\/notifications\",\"manage_notifications\",\"\\/settings\\/profile\",\"\\/settings\\/company\",\"\\/settings\\/invoice\",\"\\/settings\\/preferences\",\"view_settings\",\"manage_settings\",\"\\/support\",\"\\/support\\/guide\",\"\\/tickets\",\"\\/tickets\\/new\"]', '2026-02-06 09:30:37', '2026-02-06 10:05:06', '2026-02-05 01:14:44', 0),
(16, 'Martin', '$2y$10$QoZZzSfzVwM/3AQNLj7dXOmRRCbWYwx/hdeOTqr0itD5wvKPBhgaW', 'martin@konsut.co.ke', 'manager', '[\"\\/\",\"\\/analytics\",\"\\/new-invoice\",\"\\/invoices\",\"\\/clients\",\"\\/stock\\/inventory\",\"\\/suppliers\",\"\\/documents\",\"\\/support\\/contact\",\"\\/settings\\/profile\",\"\\/settings\\/company\",\"\\/settings\\/invoice\",\"\\/settings\\/preferences\",\"view_stock\",\"manage_stock\",\"view_orders\",\"create_order\",\"manage_invoices\",\"view_clients\",\"manage_clients\",\"view_suppliers\",\"manage_suppliers\",\"\\/tasks\",\"\\/memos\",\"\\/notifications\",\"manage_tasks\",\"manage_memos\",\"\\/support\",\"\\/support\\/guide\",\"\\/tickets\",\"\\/tickets\\/new\"]', '2026-02-05 11:06:42', '2026-02-05 11:06:48', '2026-02-05 02:31:23', 0);

-- --------------------------------------------------------

--
-- Table structure for table `vault_documents`
--

CREATE TABLE `vault_documents` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `upload_date` datetime DEFAULT NULL,
  `path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL,
  `iv` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vault_documents`
--

INSERT INTO `vault_documents` (`id`, `name`, `type`, `size`, `upload_date`, `path`, `created_at`, `user_id`, `iv`) VALUES
('6983dfe8430fd', 'KONSUT LTD_QUOTATION_QUO-0127-03 (1).pdf', 'file', '59.08 KB', '2026-02-05 00:10:16', 'enc_6983dfe842ea3.bin', '2026-02-05 00:10:16', 3, 'a7586257e5610c9eba23c61a48225888');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `fk_documents_created_by` (`created_by`);

--
-- Indexes for table `document_items`
--
ALTER TABLE `document_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `document_id` (`document_id`);

--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `memos`
--
ALTER TABLE `memos`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sequences`
--
ALTER TABLE `sequences`
  ADD PRIMARY KEY (`type`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tasks_created_by` (`created_by`),
  ADD KEY `fk_tasks_assignee` (`assignee_id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `vault_documents`
--
ALTER TABLE `vault_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_vault_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `document_items`
--
ALTER TABLE `document_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD CONSTRAINT `fk_auth_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_documents_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `document_items`
--
ALTER TABLE `document_items`
  ADD CONSTRAINT `document_items_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `login_history`
--
ALTER TABLE `login_history`
  ADD CONSTRAINT `login_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tasks_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vault_documents`
--
ALTER TABLE `vault_documents`
  ADD CONSTRAINT `fk_vault_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
