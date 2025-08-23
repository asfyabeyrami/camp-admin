"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Cookies from "js-cookie";
import { Info, Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

function statusToFa(status?: string) {
  switch (status) {
    case "PENDING":
      return "در انتظار پرداخت";
    case "PROCESSING":
      return "در حال پردازش";
    case "SHIPPED":
      return "ارسال شده";
    case "DELIVERED":
      return "تحویل شده";
    case "CANCELLED":
      return "باطل شده";
    case "REFUNDED":
      return "برگشت وجه";
    default:
      return status || "-";
  }
}
function statusToColor(status?: string) {
  switch (status) {
    case "PENDING":
      return "warning";
    case "PROCESSING":
      return "info";
    case "SHIPPED":
      return "primary";
    case "DELIVERED":
      return "success";
    case "CANCELLED":
      return "destructive";
    case "REFUNDED":
      return "secondary";
    default:
      return "default";
  }
}
const orderStatuses = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterOrderNumber, setFilterOrderNumber] = useState<string>("");
  const [filterMobile, setFilterMobile] = useState<string>("");
  // Sidebar collapse
  const [collapsed, setCollapsed] = useState(false);
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  // Order details
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  // Status change
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateStatusError, setUpdateStatusError] = useState<string | null>(
    null
  );

  const token = Cookies.get("token");

  // Fetch orders
  const fetchOrders = async (_page: number = page) => {
    setLoadingOrders(true);
    setError(null);
    try {
      let url = `${NEXT_PUBLIC_BASE_URL}/card/orderStatus?take=${rowsPerPage}&skip=${
        _page * rowsPerPage
      }`;
      if (filterStatus) url += `&status=${encodeURIComponent(filterStatus)}`;
      if (filterOrderNumber)
        url += `&orderNumber=${encodeURIComponent(filterOrderNumber)}`;
      if (filterMobile) url += `&mobile=${encodeURIComponent(filterMobile)}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("خطا در دریافت سفارشات");
      const data = await resp.json();
      const arr = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setOrders(arr.map((order: any) => ({ id: order.id, ...order })));
      setTotalOrders(typeof data.total === "number" ? data.total : arr.length);
    } catch (e: any) {
      setError(e.message ?? "خطا در دریافت سفارشات");
      setOrders([]);
      setTotalOrders(0);
    } finally {
      setLoadingOrders(false);
    }
  };

  function formatMobile(mobile?: string) {
    if (!mobile) return "-";
    let m = mobile;
    if (m.startsWith("09") && m.length === 11) m = "+98" + m.slice(1);
    if (m.startsWith("+98") && m.length > 3)
      return m.slice(0, 3) + " " + m.slice(3);
    return m;
  }
  // Fetch order details for modal
  const fetchOrderDetails = async (id: string) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setOrderDetails(null);
    try {
      const res = await fetch(`${NEXT_PUBLIC_BASE_URL}/card/${id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
      });
      if (!res.ok) throw new Error("خطا در دریافت سفارش");
      const json = await res.json();
      setOrderDetails(json?.data || null);
    } catch (e: any) {
      setDetailsError(e.message ?? "خطا در دریافت جزییات سفارش");
    } finally {
      setDetailsLoading(false);
    }
  };
  // Paging actions
  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (val: string) => {
    setRowsPerPage(Number(val));
    setPage(0);
  };
  // Filters
  const handleSearch = () => {
    setPage(0);
    fetchOrders(0);
  };
  // Modal order details
  const handleOpenModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setModalOpen(true);
    fetchOrderDetails(orderId);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setOrderDetails(null);
    setDetailsError(null);
    setSelectedOrderId(null);
  };
  // Status Modal
  const handleOpenStatusModal = (orderId: string, currentStatus: string) => {
    setSelectedOrderId(orderId);
    setSelectedStatus(currentStatus as OrderStatus);
    setStatusModalOpen(true);
  };
  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedOrderId(null);
    setSelectedStatus("");
    setUpdateStatusError(null);
  };
  const handleSubmitStatusChange = async () => {
    if (!selectedOrderId || !selectedStatus) return;
    setUpdatingStatus(true);
    setUpdateStatusError(null);
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_BASE_URL}/admin/order/${selectedOrderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: selectedStatus }),
        }
      );
      if (!response.ok) throw new Error("خطا در تغییر وضعیت سفارش");
      setMessage({
        text: "وضعیت سفارش با موفقیت به‌روزرسانی شد",
        type: "success",
      });
      fetchOrders();
      handleCloseStatusModal();
    } catch (error: any) {
      setUpdateStatusError(error.message || "خطا در تغییر وضعیت سفارش");
    } finally {
      setUpdatingStatus(false);
    }
  };
  // useEffect: Update whenever page, rowsPerPage change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // pagination
  const lastPage = Math.max(0, Math.ceil(totalOrders / rowsPerPage) - 1);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-6 flex items-center justify-center">
        <h2 className="text-xl font-bold text-center">پولاد موتور</h2>
      </div>
      <Card className="max-w-5xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-blue-800 text-center font-bold">
            لیست سفارشات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              variant={message.type === "success" ? "default" : "destructive"}
              className="mb-4"
            >
              <AlertTitle>
                {message.type === "success" ? "موفق" : "خطا"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* ------ فیلترها ------ */}
          <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3 mb-4 justify-end">
            <div className="flex flex-col">
              <Label htmlFor="filter-order">شماره سفارش</Label>
              <Input
                id="filter-order"
                placeholder="شماره سفارش"
                value={filterOrderNumber}
                onChange={(e) => setFilterOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="min-w-[120px] text-black"
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="filter-mobile">موبایل</Label>
              <Input
                id="filter-mobile"
                placeholder="موبایل"
                value={filterMobile}
                onChange={(e) =>
                  setFilterMobile(e.target.value.replace(/[^0-9]/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="min-w-[110px] text-black ltr text-left"
                maxLength={11}
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="status-filter">وضعیت</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter" className="min-w-[110px]">
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  {orderStatuses.map((statusKey) => (
                    <SelectItem key={statusKey} value={statusKey}>
                      {statusToFa(statusKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={handleSearch}
              className="mt-2 sm:mt-0"
            >
              جستجو
            </Button>
          </div>

          {/* جدول سفارشات */}
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کد سفارش</TableHead>
                  <TableHead>مشتری</TableHead>
                  <TableHead>موبایل</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead>مبلغ کل</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead align="center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, ci) => (
                        <TableCell key={ci}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-muted-foreground"
                    >
                      سفارشی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-slate-100 transition"
                    >
                      {" "}
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>
                        {(order.user?.name ?? "-") +
                          (order.user?.lastName
                            ? " " + order.user.lastName
                            : "")}
                      </TableCell>
                      <TableCell className="ltr text-left">
                        {formatMobile(order.user?.mobile)}
                      </TableCell>
                      <TableCell>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "fa-IR"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {order.totalAmount?.toLocaleString("fa-IR")} تومان
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusToColor(order.status) as any}
                          className="font-bold"
                        >
                          {statusToFa(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          title="جزئیات"
                          className="mr-1"
                          onClick={() => handleOpenModal(order.id)}
                        >
                          <Info size={17} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="تغییر وضعیت"
                          onClick={() =>
                            handleOpenStatusModal(order.id, order.status)
                          }
                          disabled={
                            order.status === "DELIVERED" ||
                            order.status === "CANCELLED" ||
                            order.status === "REFUNDED"
                          }
                        >
                          <Pencil size={17} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* صفحه بندی سفارشی */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-3">
            <div className="text-sm text-muted-foreground">
              {`نمایش ${
                orders.length === 0 ? 0 : page * rowsPerPage + 1
              } تا ${Math.min(
                (page + 1) * rowsPerPage,
                totalOrders
              )} از ${totalOrders} سفارش`}
            </div>
            <div className="flex items-center gap-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 0) handleChangePage(page - 1);
                      }}
                      aria-disabled={page === 0}
                      size={undefined}
                    />
                  </PaginationItem>
                  {[...Array(Math.ceil(totalOrders / rowsPerPage))]
                    .map((_, i) => i)
                    .slice(Math.max(0, page - 2), page + 3)
                    .map((pidx) => (
                      <PaginationItem key={`page-${pidx}`}>
                        <PaginationLink
                          href="#"
                          isActive={pidx === page}
                          onClick={(e) => {
                            e.preventDefault();
                            handleChangePage(pidx);
                          }}
                          size={undefined}
                        >
                          {pidx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < lastPage) handleChangePage(page + 1);
                      }}
                      aria-disabled={page >= lastPage}
                      size={undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <Select
                value={String(rowsPerPage)}
                onValueChange={handleChangeRowsPerPage}
              >
                <SelectTrigger className="min-w-[72px]" />
                <SelectContent>
                  {[10, 25, 50, 100].map((num) => (
                    <SelectItem key={String(num)} value={String(num)}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* -------- MODAL ها ---------- */}
      {/* تغییر وضعیت */}
      <Dialog
        open={statusModalOpen}
        onOpenChange={(open: any) => !open && handleCloseStatusModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold text-lg mb-2">
              تغییر وضعیت سفارش
            </DialogTitle>
          </DialogHeader>
          <div className="mb-3">
            <Label>وضعیت جدید</Label>
            <Select
              value={selectedStatus}
              onValueChange={(val: any) =>
                setSelectedStatus(val as OrderStatus)
              }
              disabled={updatingStatus}
            >
              <SelectTrigger className="mt-2" />
              <SelectContent>
                {orderStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusToFa(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {updateStatusError && (
            <Alert variant="destructive" className="mb-2">
              <AlertTitle>خطا</AlertTitle>
              <AlertDescription>{updateStatusError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseStatusModal}
              disabled={updatingStatus}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmitStatusChange}
              variant="default"
              disabled={!selectedStatus || updatingStatus}
            >
              {updatingStatus && (
                <Loader2 size={16} className="mr-2 animate-spin" />
              )}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* جزییات سفارش */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open: any) => !open && handleCloseModal()}
      >
        <DialogContent className="max-w-lg md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">
              جزییات سفارش
            </DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Loader2 size={30} className="animate-spin" />
              <div className="text-xs text-muted-foreground mt-2">
                در حال بارگذاری سفارش...
              </div>
            </div>
          ) : detailsError ? (
            <Alert variant="destructive">
              <AlertTitle>خطا</AlertTitle>
              <AlertDescription>{detailsError}</AlertDescription>
            </Alert>
          ) : !orderDetails ? (
            <Alert>
              <AlertTitle>سفارشی پیدا نشد</AlertTitle>
            </Alert>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 mb-2">
                <div>
                  <span className="font-semibold">کد سفارش:</span>{" "}
                  {orderDetails.orderNumber}
                </div>
                <div>
                  <span className="font-semibold">وضعیت:</span>
                  <Badge
                    className="mx-2 font-bold"
                    variant={statusToColor(orderDetails.status) as any}
                  >
                    {statusToFa(orderDetails.status)}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold">مشتری:</span>{" "}
                  {orderDetails.user?.name ?? "-"}{" "}
                  {orderDetails.user?.lastName ?? ""}
                </div>
                <div>
                  <span className="font-semibold">موبایل:</span>{" "}
                  {orderDetails.user?.mobile ?? "-"}
                </div>
                <div>
                  <span className="font-semibold">آدرس:</span>{" "}
                  {typeof orderDetails.address?.address === "string"
                    ? orderDetails.address?.address
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold">مبلغ کل:</span>{" "}
                  {orderDetails.totalAmount?.toLocaleString("fa-IR") ?? 0} تومان
                </div>
                <div>
                  <span className="font-semibold">تاریخ ثبت:</span>{" "}
                  {orderDetails.createdAt
                    ? new Date(orderDetails.createdAt).toLocaleDateString(
                        "fa-IR"
                      )
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold">نوع پرداخت:</span>{" "}
                  {orderDetails.paymentType === "ONLINE"
                    ? "پرداخت آنلاین"
                    : orderDetails.paymentType}
                </div>
              </div>
              <div className="border-t pt-4 mt-2">
                <h3 className="font-semibold mb-2">آیتم‌های سفارش</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>نام محصول</TableHead>
                      <TableHead>تعداد</TableHead>
                      <TableHead>قیمت واحد</TableHead>
                      <TableHead>مبلغ کل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(orderDetails.orderItems || []).map(
                      (item: any, i: number) => (
                        <TableRow key={item.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{item.product?.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {item.price?.toLocaleString("fa-IR")}
                          </TableCell>
                          <TableCell>
                            {(item.price * item.quantity)?.toLocaleString(
                              "fa-IR"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
