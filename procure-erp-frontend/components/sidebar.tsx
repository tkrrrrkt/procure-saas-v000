// components/Sidebar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  FileQuestion,
  FileText,
  ClipboardList,
  Globe,
  ShoppingCart,
  Printer,
  History,
  FileUp,
  Truck,
  Calendar,
  PackageCheck,
  Boxes as BoxesIcon,
  Box as BoxIcon,
  Layers,
  ArrowDownUp,
  LogOut,
  Search,
  Database,
  CreditCard,
  AlertTriangle,
  Warehouse,
  Users,
  Building,
  UserCircle,
  ListFilter,
  FilePlus,
  LineChart,
  BarChart3,
  ChevronDown,
  Package as PackageIcon,        // ← alias here
} from "lucide-react";

interface NavItem {
  title:    string;
  href:     string;
  icon:     React.ReactNode;
  submenu?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "ダッシュボード",
    href:  "/dashboard",
    icon:  <Home className="h-5 w-5" />,
  },
  {
    title: "発注依頼",
    href:  "/purchase-requests",
    icon:  <FileQuestion className="h-5 w-5" />,
    submenu: [
      { title: "発注依頼入力", href: "/purchase-requests/new", icon: <FileText className="h-4 w-4" /> },
      { title: "発注依頼一覧", href: "/purchase-requests",     icon: <ClipboardList className="h-4 w-4" /> },
      { title: "Web見積回答",   href: "/supplier/quotation-responses", icon: <Globe className="h-4 w-4" /> },
    ],
  },
  {
    title: "購買管理",
    href:  "/purchase-orders",
    icon:  <ShoppingCart className="h-5 w-5" />,
    submenu: [
      {
        title: "発注管理",
        href:  "/purchase-orders",
        icon:  <FileText className="h-4 w-4" />,
        submenu: [
          { title: "発注入力",   href: "/purchase-orders/new",         icon: <FileText className="h-4 w-4" /> },
          { title: "発注一覧",   href: "/purchase-orders",             icon: <ClipboardList className="h-4 w-4" /> },
          { title: "データ取込", href: "/purchase-orders/import",      icon: <FileUp className="h-4 w-4" /> },
          { title: "注文書発行", href: "/purchase-orders/issue",       icon: <Printer className="h-4 w-4" /> },
          { title: "Web照会",   href: "/purchase-orders/web-portal", icon: <Globe className="h-4 w-4" /> },
          { title: "点発注履歴", href: "/reorder-point/auto-order/history", icon: <History className="h-4 w-4" /> },
        ],
      },
      {
        title: "入荷管理",
        href:  "/receiving",
        icon:  <Truck className="h-4 w-4" />,
        submenu: [
          { title: "予定照会", href: "/receiving/arrivals/schedule", icon: <Calendar className="h-4 w-4" /> },
          { title: "入荷一覧", href: "/receiving/arrivals",          icon: <ClipboardList className="h-4 w-4" /> },
          { title: "入荷処理", href: "/receiving/arrivals/new",      icon: <PackageCheck className="h-4 w-4" /> },
          { title: "一括入荷", href: "/receiving/arrivals/bulk",     icon: <BoxesIcon className="h-4 w-4" /> },
          { title: "仕入一覧", href: "/receiving",                   icon: <ClipboardList className="h-4 w-4" /> },
          { title: "仕入入力", href: "/receiving/new",               icon: <FileText className="h-4 w-4" /> },
          { title: "一括仕入", href: "/receiving/purchases/bulk",    icon: <BoxesIcon className="h-4 w-4" /> },
          { title: "請求照合", href: "/invoice-matching/list",       icon: <FileText className="h-4 w-4" /> },
        ],
      },
      {
        title: "在庫管理",
        href:  "/inventory",
        icon:  <BoxIcon className="h-4 w-4" />,
        submenu: [
          { title: "在庫一覧", href: "/inventory",              icon: <Layers className="h-4 w-4" /> },
          { title: "受払照会", href: "/inventory/transactions", icon: <ArrowDownUp className="h-4 w-4" /> },
          { title: "出庫入力", href: "/inventory/issue",        icon: <LogOut className="h-4 w-4" /> },
        ],
      },
      {
        title: "ECサイト価格検索",
        href:  "/ec-price-search",
        icon:  <Search className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "マスタ管理",
    href:  "/master",
    icon:  <Database className="h-5 w-5" />,
    submenu: [
      { title: "単価管理",   href: "/price-management/vendor-prices", icon: <CreditCard className="h-4 w-4" /> },
      { title: "発注点管理", href: "/reorder-point",                icon: <AlertTriangle className="h-4 w-4" /> },
      { title: "倉庫管理",   href: "/warehouses",                   icon: <Warehouse className="h-4 w-4" /> },
      { title: "取引先管理", href: "/vendors",                      icon: <Users className="h-4 w-4" /> },
      { title: "組織管理",   href: "/organizations",                icon: <Building className="h-4 w-4" /> },
      { title: "社員管理",   href: "/employees",                    icon: <UserCircle className="h-4 w-4" /> },
      { title: "商品管理",   href: "/products",                     icon: <PackageIcon className="h-4 w-4" /> },  // ← correct
    ],
  },
  {
    title: "アナリシス",
    href:  "/analysis",
    icon:  <LineChart className="h-5 w-5" />,
    submenu: [
      { title: "レポート", href: "/reports", icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "purchase-requests": true,
    "purchase-orders":   true,
    receiving:           true,
    inventory:           true,
    master:              true,
  });

  const toggleMenu = (key: string) =>
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderItem = (item: NavItem, depth = 0) => {
    const isActive =
      pathname === item.href ||
      pathname.startsWith(item.href + "/");

    if (!item.submenu) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
            depth === 0 && "font-medium",
            isActive
              ? "bg-muted text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-primary"
          )}
        >
          {item.icon}
          <span>{item.title}</span>
        </Link>
      );
    }

    const opened = !!openMenus[item.title];
    return (
      <div key={item.href}>
        <button
          onClick={() => toggleMenu(item.title)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm",
            depth === 0 && "font-medium",
            isActive
              ? "bg-muted text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-primary"
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.title}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", opened && "rotate-180")} />
        </button>
        {opened && (
          <div className="ml-4 mt-1 space-y-1">
            {item.submenu!.map((sub) => renderItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <nav className="flex-1 overflow-auto py-4 px-2 text-sm">
        {navItems.map((item) => renderItem(item))}
      </nav>
    </aside>
  );
}
