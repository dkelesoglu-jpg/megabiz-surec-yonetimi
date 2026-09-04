"use client";
export default function OtherActionsMenu({
  label = "Diğer İşlemler",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  function open(name: string) {
    window.dispatchEvent(new Event(name));
  }
  return (
    <details className={`standard-more-menu ${className}`}>
      <summary title="Yönetim ve diğer işlemleri aç">
        <span aria-hidden="true">⋯</span>
        {label}
        <i>⌄</i>
      </summary>
      <div role="menu">
        <button role="menuitem" onClick={() => open("open-company-admin")}>
          <span>▦</span>Şirket Yönetimi
        </button>
        <button role="menuitem" onClick={() => open("open-security-center")}>
          <span>⚿</span>Güvenlik Merkezi
        </button>
      </div>
    </details>
  );
}
