import {
  Calendar,
  Clock,
  Copy,
  DollarSign,
  Edit,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function OrganizerMobileEventCard({
  event,
  status,
  progress,
  activeMenuId,
  setActiveMenuId,
  onViewDetails,
  onEditEvent,
  onOpenEmail,
  onDuplicate,
  onDelete,
}) {
  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-[#d9e2ec] bg-white shadow-sm sm:hidden">
      <div className="relative h-44 overflow-hidden">
        <img
          src={event.imagePreview}
          alt={event.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/80 via-[#07111f]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold backdrop-blur",
                status.className,
              )}
            >
              {status.label}
            </span>
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-[0.68rem] font-medium text-white">
              {event.isPaid ? `$${Number(event.price || 0).toFixed(2)}` : "Free"}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold leading-tight">
            {event.title}
          </h3>
          <p className="mt-1 text-xs font-medium tracking-[0.08em] text-white/80">
            {event.dateLabel || event.date} • {event.time}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm leading-6 text-[#5f7088]">
              {event.description ||
                "Keep attendees informed with a clean event summary, logistics, and current registration progress."}
            </p>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() =>
                setActiveMenuId((current) => (current === event.id ? null : event.id))
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f8fafc] text-[#0f1e33] shadow-sm transition hover:text-[#f36f21]"
            >
              <MoreHorizontal size={15} />
            </button>
            {activeMenuId === event.id ? (
              <div className="absolute right-0 top-10 z-30 w-48 rounded-2xl border border-[#d9e2ec] bg-white p-2 shadow-xl">
                <button type="button" onClick={() => onViewDetails(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#0f1e33] hover:bg-[#f5f7fa]">
                  <Eye size={14} />
                  View Details
                </button>
                <button type="button" onClick={() => onEditEvent(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#0f1e33] hover:bg-[#f5f7fa]">
                  <Edit size={14} />
                  Edit Event
                </button>
                <button type="button" onClick={() => onOpenEmail(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#0f1e33] hover:bg-[#f5f7fa]">
                  <Mail size={14} />
                  Send Notification
                </button>
                <button type="button" onClick={() => onDuplicate(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#0f1e33] hover:bg-[#f5f7fa]">
                  <Copy size={14} />
                  Duplicate
                </button>
                <button type="button" onClick={() => onDelete(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 text-sm font-medium text-[#516072]">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#f36f21]" />
            <span>{event.dateLabel || event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#f36f21]" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#f36f21]" />
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-[#f36f21]" />
            <span>
              {event.isPaid
                ? `$${Number(event.price || 0).toFixed(2)} per ticket`
                : "Free entry"}
            </span>
          </div>
        </div>

        {event.tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#f5f7fa] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#1f4e79]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="rounded-[0.95rem] bg-[#f8fafc] p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users size={13} className="text-[#1f4e79]" />
              <span>
                <span className="font-medium text-gray-800">{event.registrations}</span> /{" "}
                {event.capacity} registered
              </span>
            </div>
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#1f4e79]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dfe8f2]">
            <div
              className="h-full rounded-full bg-[#f36f21]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
