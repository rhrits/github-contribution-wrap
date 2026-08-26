import styles from "@/app/wrap.module.css";

export function BrandLogo() {
  return (
    <span className={styles.brand} role="img" aria-label="WRAP.">
      <svg className={styles.brandMark} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#050a07" />
        <rect x="10" y="10" width="8" height="8" rx="1.5" fill="#161b22" />
        <rect x="20" y="10" width="8" height="8" rx="1.5" fill="#0e4429" />
        <rect x="30" y="10" width="8" height="8" rx="1.5" fill="#26a641" />
        <rect x="40" y="10" width="8" height="8" rx="1.5" fill="#0e4429" />
        <rect x="50" y="10" width="8" height="8" rx="1.5" fill="#161b22" />
        <rect x="10" y="20" width="8" height="8" rx="1.5" fill="#006d32" />
        <rect x="20" y="20" width="8" height="8" rx="1.5" fill="#39d353" />
        <rect x="30" y="20" width="8" height="8" rx="1.5" fill="#26a641" />
        <rect x="40" y="20" width="8" height="8" rx="1.5" fill="#39d353" />
        <rect x="50" y="20" width="8" height="8" rx="1.5" fill="#0e4429" />
        <rect x="10" y="30" width="8" height="8" rx="1.5" fill="#161b22" />
        <rect x="20" y="30" width="8" height="8" rx="1.5" fill="#26a641" />
        <rect x="30" y="30" width="8" height="8" rx="1.5" fill="#39d353" />
        <rect x="40" y="30" width="8" height="8" rx="1.5" fill="#006d32" />
        <rect x="50" y="30" width="8" height="8" rx="1.5" fill="#161b22" />
        <rect x="10" y="40" width="8" height="8" rx="1.5" fill="#0e4429" />
        <rect x="20" y="40" width="8" height="8" rx="1.5" fill="#39d353" />
        <rect x="30" y="40" width="8" height="8" rx="1.5" fill="#26a641" />
        <rect x="40" y="40" width="8" height="8" rx="1.5" fill="#39d353" />
        <rect x="50" y="40" width="8" height="8" rx="1.5" fill="#006d32" />
        <rect x="10" y="50" width="8" height="8" rx="1.5" fill="#161b22" />
        <rect x="20" y="50" width="8" height="8" rx="1.5" fill="#0e4429" />
        <rect x="30" y="50" width="8" height="8" rx="1.5" fill="#006d32" />
        <rect x="40" y="50" width="8" height="8" rx="1.5" fill="#0e4429" />
        <rect x="50" y="50" width="8" height="8" rx="1.5" fill="#161b22" />
      </svg>
      <span className={styles.navMark}>WRAP<span>.</span></span>
    </span>
  );
}
