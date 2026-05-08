const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function UserMobileEventCard({
  event,
  registeringEventId,
  onViewDetails,
  onRegister,
}) {
  const progress =
    event.capacity > 0 ? Math.min(100, (event.registrations / event.capacity) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-[#d9e2ec] bg-white shadow-sm sm:hidden">
      <div className="relative h-44 overflow-hidden">
        <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/80 via-[#07111f]/25 to-transparent" />
        {Number.isFinite(event.aiMatch) ? (
          <span className="absolute right-2 top-2 rounded-full bg-purple-600 px-2 py-1 text-[0.68rem] text-white">
            {event.aiMatch}% match
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex rounded-full bg-white/18 px-2.5 py-1 text-[0.68rem] font-semibold backdrop-blur">
              {event.category}
            </span>
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-[0.68rem] font-medium text-white">
              {event.isPaid ? `$${event.price}` : "Free"}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold leading-tight">{event.title}</h3>
          <p className="mt-1 text-xs font-medium tracking-[0.08em] text-white/80">
            {event.date} • {event.time}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-6 text-[#5f7088]">
          {event.aiReason ||
            event.description ||
            "Browse details, availability, and booking options before registering."}
        </p>

        <div className="grid gap-2 text-sm font-medium text-[#516072]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#f36f21]">Date</span>
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#f36f21]">Time</span>
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#f36f21]">Place</span>
            <span>{event.venue}</span>
          </div>
        </div>

        <div className="rounded-[0.95rem] bg-[#f8fafc] p-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-500">
              Registered <span className="font-medium text-gray-800">{event.registrations}</span> /{" "}
              {event.capacity}
            </span>
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#1f4e79]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                "h-full rounded-full",
                event.registrations / event.capacity > 0.9 ? "bg-red-500" : "bg-[#f36f21]",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            onClick={() => onViewDetails(event)}
          >
            View
          </button>
          <button
            className="flex-1 rounded-lg bg-[#f36f21] py-2 text-sm font-medium text-white transition-colors hover:bg-[#e05e10] disabled:cursor-not-allowed disabled:bg-gray-300"
            onClick={() => onRegister(event)}
            disabled={registeringEventId === event.id}
          >
            {registeringEventId === event.id
              ? "Registering..."
              : `${event.isPaid ? `$${event.price}` : "Free"} - Register`}
          </button>
        </div>
      </div>
    </section>
  );
}
