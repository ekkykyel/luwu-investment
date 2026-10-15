import Swal from "sweetalert2";

export const showGisErrorToast = (message: string, title = "Gagal memuat analitik") => {
  try {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
      background: "#0f172a",
      color: "#f8fafc",
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: title,
      text: message,
    });
  } catch (e) {
    console.error("Toast notification failed:", e, title, message);
  }
};

export const showGisWarningToast = (message: string, title = "Pemberitahuan Sistem") => {
  try {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      background: "#0f172a",
      color: "#f8fafc",
    });

    Toast.fire({
      icon: "warning",
      title: title,
      text: message,
    });
  } catch (e) {
    console.warn("Toast warning failed:", e, title, message);
  }
};

export const showSyncDiscrepancyToast = (discrepancyCount: number) => {
  try {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
      background: "#0f172a",
      color: "#f8fafc",
      customClass: {
        popup: "border border-amber-500/40 shadow-2xl rounded-2xl",
      },
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "warning",
      title: "Sync Status: Perbedaan Data Terdeteksi!",
      text: `Ditemukan ${discrepancyCount} proyek dengan perbedaan data antara Local State dan Supabase Master DB.`,
    });
  } catch (e) {
    console.warn("Sync discrepancy toast failed:", e);
  }
};

export const showSyncSuccessToast = (message = "Semua data lokal synchronized 100% dengan Supabase Master.") => {
  try {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      background: "#0f172a",
      color: "#f8fafc",
      customClass: {
        popup: "border border-emerald-500/40 shadow-2xl rounded-2xl",
      },
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "success",
      title: "Sync Status: Data Terverifikasi",
      text: message,
    });
  } catch (e) {
    console.warn("Sync success toast failed:", e);
  }
};

