import { ExternalLink, Mail } from "lucide-react";

const OUTLOOK_URL = "https://outlook.office.com";

/** Many students never open their KNUST email, but it is where our codes go. */
export default function OutlookNotice({ what = "verification code", showButton = false }: { what?: string; showButton?: boolean }) {
  return (
    <div className="rounded-xl bg-brand/5 px-3.5 py-3 text-xs leading-5 text-ink/70">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Mail size={15} aria-hidden="true" />Your student email lives in Outlook</p>
      <p className="mt-1">
        We send your {what} to your @st.knust.edu.gh address. KNUST student mail is on Microsoft Outlook: sign in at{" "}
        <a href={OUTLOOK_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">outlook.office.com</a>{" "}
        with your full student email and password. Not there? Check Junk. Forgot that password? The KNUST UITS helpdesk can reset it.
      </p>
      {showButton && (
        <a href={OUTLOOK_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-3 inline-flex items-center gap-1.5 text-sm">
          Open Outlook <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
