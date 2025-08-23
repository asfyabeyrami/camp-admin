"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// توجه کن هیچ وابستگی به shadcn/select نداره چون خودش لیست اختصاصی درختی می‌سازه.
// اگر خواستی دقیقا مشابه فرم محصول باشه باید براش سرچ و ... بذاری.

interface CategoryNode {
  id: string;
  title: string;
  children?: CategoryNode[];
  description?: { text: string } | null;
}
interface Props {
  value: string | null;
  onChange: (val: string | null) => void;
  treeData: CategoryNode[];
  placeholder?: string;
}
const CustomTreeSelect: React.FC<Props> = ({
  value,
  onChange,
  treeData,
  placeholder = "انتخاب دسته‌بندی والد",
}) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const renderTree = (nodes: CategoryNode[], depth = 0) =>
    nodes.map((node) => {
      const isExpanded = expanded.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const isSelected = value === node.id;
      return (
        <div key={node.id} className="mb-1">
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              onChange(node.id);
              setOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(node.id);
                setOpen(false);
              }
            }}
            className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer select-none
              ${
                isSelected
                  ? "bg-blue-100 text-blue-800 font-semibold border border-blue-200 shadow-sm"
                  : "hover:bg-gray-50 focus:bg-blue-50 transition border border-transparent"
              }`}
            style={{ paddingLeft: `${depth * 16 + 16}px` }}
          >
            {hasChildren && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                aria-label={isExpanded ? "بستن زیرمجموعه" : "نمایش زیرمجموعه"}
                tabIndex={-1}
                className="text-gray-400 hover:text-blue-600"
              >
                {isExpanded ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </Button>
            )}
            <span className="truncate flex-1 text-[15px]">{node.title}</span>
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-1 ml-2 border-l border-gray-200 pl-2">
              {renderTree(node.children || [], depth + 1)}
            </div>
          )}
        </div>
      );
    });

  const findNodeById = (
    nodes: CategoryNode[],
    id: string
  ): CategoryNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const result = findNodeById(node.children, id);
        if (result) return result;
      }
    }
    return null;
  };
  const selectedNode = value ? findNodeById(treeData, value) : null;

  return (
    <div ref={containerRef} className="relative w-full text-sm">
      <div
        onClick={() => setOpen(!open)}
        className={`w-full border ${
          open ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-300"
        } rounded-lg px-3 py-2 bg-white cursor-pointer flex items-center justify-between shadow
         transition focus:ring-2 focus:ring-blue-400`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex-1 truncate pr-2">
          {selectedNode ? (
            <div>
              <span className="font-semibold text-[15px]">
                {selectedNode.title}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="text-gray-400 hover:text-red-400"
            aria-label="حذف انتخاب"
            tabIndex={-1}
          >
            <X size={18} />
          </Button>
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </div>
      {open && (
        <Card className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-2xl max-h-72 overflow-auto py-2 animate-fadein transition">
          <CardContent className="p-0">
            {treeData.length > 0 ? (
              renderTree(treeData)
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                دسته‌بندی‌ای وجود ندارد
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomTreeSelect;
