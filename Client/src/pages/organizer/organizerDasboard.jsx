import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  DollarSign,
  Eye,
  Loader2,
  Save,
  Sparkles,
  Tag,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";

const EVENT_STORAGE_KEY = "smart_event_organizer_events";
const venues = ["Main Auditorium", "Conference Hall", "Room 301", "Room 302", "Computer Lab A", "Computer Lab B", "Exhibition Hall", "Outdoor Area"];
const categories = ["Workshop", "Seminar", "Conference", "Networking", "Career Fair", "Cultural Event", "Sports Event", "Technology", "Academic", "Other"];
const availableTags = ["Technology", "Business", "Career", "Workshop", "Networking", "Academic", "Cultural", "Sports", "AI", "Data Science", "Leadership", "Finance", "Marketing", "Innovation", "Professional Development"];

const cn = (...classes) => classes.filter(Boolean).join(" ");

const timeSuggestionsByCategory = {
  workshop: [
    { startTime: "10:00", endTime: "12:00", reason: "Late morning workshops usually get strong attendance." },
    { startTime: "14:00", endTime: "16:00", reason: "A mid-afternoon slot works well for hands-on sessions." },
  ],
  seminar: [
    { startTime: "11:00", endTime: "12:30", reason: "Seminars often work best before lunch." },
    { startTime: "15:00", endTime: "16:30", reason: "Afternoon seminars fit well between classes." },
  ],
  networking: [
    { startTime: "17:00", endTime: "19:00", reason: "Networking events usually feel more natural in the evening." },
    { startTime: "16:30", endTime: "18:00", reason: "This slot works well after the day winds down." },
  ],
};

function formatDisplayDate(dateValue) {
  if (!dateValue) return "Select date";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateValue));
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildDescription({ title, category, venue, capacity, isPaid, price, tags }) {
  const tagLine = tags.length ? ` Topics include ${tags.join(", ")}.` : "";
  const priceLine = isPaid && price ? ` Tickets are $${price}.` : " This event is free to attend.";
  return `${title} is a ${category || "campus"} event designed to bring the community together at ${venue || "our campus venue"}. It is planned for up to ${capacity || "a select number of"} attendees and aims to deliver an engaging experience.${tagLine}${priceLine}`;
}

function getSuggestedTimes(category) {
  return timeSuggestionsByCategory[(category || "").toLowerCase()] || [
    { startTime: "10:00", endTime: "12:00", reason: "This is a balanced daytime slot for most campus events." },
    { startTime: "13:00", endTime: "15:00", reason: "A post-lunch session is a good general option." },
  ];
}

function getSuggestedTags(title, category) {
  const haystack = `${title} ${category}`.toLowerCase();
  if (haystack.includes("tech") || haystack.includes("ai")) return ["Technology", "AI", "Innovation", "Data Science"];
  if (haystack.includes("career") || haystack.includes("job")) return ["Career", "Leadership", "Professional Development", "Business"];
  if (haystack.includes("sport")) return ["Sports", "Networking"];
  if (haystack.includes("culture")) return ["Cultural", "Networking"];
  return availableTags.filter((tag) => tag.toLowerCase() === (category || "").toLowerCase());
}

function OrganizerDashboard() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const fileInputRef = useRef(null);
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSuggestingTime, setIsSuggestingTime] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);

  useEffect(() => () => {
    uploadedImages.forEach((image) => URL.revokeObjectURL(image.preview));
  }, [uploadedImages]);

  if (!currentUser || currentUser.role !== "organizer") {
    return <Navigate to="/login" replace />;
  }

  const clearNotice = () => notice && setNotice(null);
  const setField = (setter) => (event) => {
    setter(event.target.value);
    clearNotice();
  };

  const addTag = (value) => {
    const nextTag = value.trim();
    if (!nextTag || selectedTags.includes(nextTag) || selectedTags.length >= 5) {
      setTagInput("");
      return;
    }
    setSelectedTags((prev) => [...prev, nextTag]);
    setTagInput("");
    setErrors((prev) => ({ ...prev, tags: "" }));
    clearNotice();
  };

  const addImages = (files) => {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return setNotice({ type: "error", message: "Please upload image files only." });
    const nextImages = imageFiles.slice(0, Math.max(0, 5 - uploadedImages.length)).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    if (!nextImages.length) return setNotice({ type: "error", message: "You can upload a maximum of 5 images." });
    setUploadedImages((prev) => [...prev, ...nextImages].slice(0, 5));
    setNotice({ type: "success", message: `${nextImages.length} image(s) added successfully.` });
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!description.trim()) nextErrors.description = "Description is required.";
    if (!date) nextErrors.date = "Date is required.";
    if (!startTime) nextErrors.startTime = "Start time is required.";
    if (!endTime) nextErrors.endTime = "End time is required.";
    if (startTime && endTime && startTime >= endTime) nextErrors.endTime = "End time must be later than start time.";
    if (!venue) nextErrors.venue = "Venue is required.";
    if (!category) nextErrors.category = "Category is required.";
    if (!capacity || Number(capacity) <= 0) nextErrors.capacity = "Enter a valid capacity.";
    if (!selectedTags.length) nextErrors.tags = "Add at least one tag.";
    if (isPaid && (!price || Number(price) <= 0)) nextErrors.price = "Enter a valid ticket price.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerateDescription = async () => {
    if (!title.trim()) return setNotice({ type: "error", message: "Enter an event title first." });
    setIsGeneratingDescription(true);
    clearNotice();
    await wait(700);
    setDescription(buildDescription({ title, category, venue, capacity, isPaid, price, tags: selectedTags }));
    setErrors((prev) => ({ ...prev, description: "" }));
    setNotice({ type: "success", message: "Description generated successfully." });
    setIsGeneratingDescription(false);
  };

  const handleSuggestTime = async () => {
    if (!category) return setNotice({ type: "error", message: "Select a category first." });
    setIsSuggestingTime(true);
    clearNotice();
    await wait(600);
    setSuggestedTimes(getSuggestedTimes(category));
    setShowTimeSuggestions(true);
    setNotice({ type: "success", message: "Suggested time slots are ready." });
    setIsSuggestingTime(false);
  };

  const handleSuggestTags = async () => {
    if (!title.trim() && !category) return setNotice({ type: "error", message: "Add a title or choose a category first." });
    setIsSuggestingTags(true);
    clearNotice();
    await wait(600);
    const tagsToAdd = getSuggestedTags(title, category).filter((tag) => !selectedTags.includes(tag)).slice(0, 5 - selectedTags.length);
    if (!tagsToAdd.length) {
      setNotice({ type: "error", message: "No new tag suggestions were found." });
    } else {
      setSelectedTags((prev) => [...prev, ...tagsToAdd]);
      setErrors((prev) => ({ ...prev, tags: "" }));
      setNotice({ type: "success", message: `Added ${tagsToAdd.length} suggested tag(s).` });
    }
    setIsSuggestingTags(false);
  };

  const handleSubmit = () => {
    clearNotice();
    if (!validateForm()) return setNotice({ type: "error", message: "Please fix the required fields first." });
    const savedEvents = JSON.parse(window.localStorage.getItem(EVENT_STORAGE_KEY) || "[]");
    const newEvent = {
      id: `event-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      date,
      dateLabel: formatDisplayDate(date),
      time: `${startTime} - ${endTime}`,
      venue,
      category,
      capacity: Number(capacity),
      isPaid,
      price: isPaid ? Number(price) : 0,
      tags: selectedTags,
      organizerName: currentUser.name || currentUser.email,
      organizerEmail: currentUser.email,
      imagePreview: uploadedImages[0]?.preview || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify([newEvent, ...savedEvents]));
    uploadedImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setDate(""); setTitle(""); setDescription(""); setCategory(""); setVenue(""); setCapacity("");
    setStartTime(""); setEndTime(""); setIsPaid(false); setPrice(""); setSelectedTags([]); setTagInput("");
    setUploadedImages([]); setErrors({}); setSuggestedTimes([]); setShowTimeSuggestions(false);
    setNotice({ type: "success", message: "Event submitted for admin approval." });
  };

  const inputClass = (name) => cn("w-full rounded-xl border px-4 py-3 outline-none transition", errors[name] ? "border-rose-400 bg-rose-50" : "border-[#d9e2ec] bg-white focus:border-[#1f4e79]");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f36f21]">Organizer Workspace</p>
            <h1 className="mt-2 text-3xl font-bold text-[#0f1e33]">Create New Event</h1>
            <p className="mt-2 max-w-2xl text-[#6b7c93]">This is your organizer page after login. You can create and submit events from here.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] px-4 py-2.5 font-medium text-[#0f1e33]">
              <Eye size={18} />
              Preview
            </button>
            <button type="button" onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white">
              <Save size={18} />
              Submit for Approval
            </button>
          </div>
        </div>
        {notice ? (
          <div className={cn("rounded-2xl border px-4 py-3 text-sm font-medium", notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700")}>
            {notice.message}
          </div>
        ) : null}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0f1e33]">Basic Information</h2>
              <p className="mt-1 text-sm text-[#6b7c93]">Enter the core details of your event.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="title" className="mb-2 block text-sm font-medium text-[#0f1e33]">Event Title *</label>
                  <input id="title" type="text" value={title} onChange={setField(setTitle)} placeholder="Enter event title" className={inputClass("title")} />
                  {errors.title ? <p className="mt-2 text-sm text-rose-600">{errors.title}</p> : null}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="description" className="block text-sm font-medium text-[#0f1e33]">Description *</label>
                    <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDescription} className="inline-flex items-center gap-2 rounded-lg border border-[#d9e2ec] px-3 py-2 text-sm font-medium text-[#1f4e79] disabled:cursor-not-allowed disabled:opacity-70">
                      {isGeneratingDescription ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Generate Description
                    </button>
                  </div>
                  <textarea id="description" rows="5" value={description} onChange={setField(setDescription)} placeholder="Describe your event..." className={inputClass("description")} />
                  {errors.description ? <p className="mt-2 text-sm text-rose-600">{errors.description}</p> : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0f1e33]">Category *</label>
                    <select value={category} onChange={setField(setCategory)} className={inputClass("category")}>
                      <option value="">Select category</option>
                      {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    {errors.category ? <p className="mt-2 text-sm text-rose-600">{errors.category}</p> : null}
                  </div>
                  <div>
                    <label htmlFor="capacity" className="mb-2 block text-sm font-medium text-[#0f1e33]">Capacity *</label>
                    <div className="relative">
                      <Users size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                      <input id="capacity" type="number" value={capacity} onChange={setField(setCapacity)} placeholder="100" className={cn(inputClass("capacity"), "pl-11")} />
                    </div>
                    {errors.capacity ? <p className="mt-2 text-sm text-rose-600">{errors.capacity}</p> : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-[#0f1e33]"><Tag size={20} className="text-[#f36f21]" />Event Tags *</h2>
                  <p className="mt-1 text-sm text-[#6b7c93]">Add up to five tags so users can discover your event.</p>
                </div>
                <button type="button" onClick={handleSuggestTags} disabled={isSuggestingTags} className="inline-flex items-center gap-2 rounded-lg border border-[#d9e2ec] px-3 py-2 text-sm font-medium text-[#1f4e79] disabled:cursor-not-allowed disabled:opacity-70">
                  {isSuggestingTags ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Suggest Tags
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedTags.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full bg-[#fff1e8] px-3 py-1.5 text-sm font-medium text-[#f36f21]">
                    {item}
                    <button type="button" onClick={() => setSelectedTags((prev) => prev.filter((tag) => tag !== item))}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <select value={tagInput} onChange={(event) => { setTagInput(event.target.value); if (event.target.value) addTag(event.target.value); }} className={inputClass("tags")}>
                  <option value="">Select a tag</option>
                  {availableTags.filter((item) => !selectedTags.includes(item)).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              {errors.tags ? <p className="mt-2 text-sm text-rose-600">{errors.tags}</p> : null}
              <p className="mt-3 text-xs text-[#6b7c93]">{selectedTags.length}/5 tags selected</p>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#0f1e33]">Date, Time & Venue</h2>
                  <p className="mt-1 text-sm text-[#6b7c93]">Set when and where your event will happen.</p>
                </div>
                <button type="button" onClick={handleSuggestTime} disabled={isSuggestingTime} className="inline-flex items-center gap-2 rounded-lg border border-[#d9e2ec] px-3 py-2 text-sm font-medium text-[#1f4e79] disabled:cursor-not-allowed disabled:opacity-70">
                  {isSuggestingTime ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                  Suggest Best Time
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="date" className="mb-2 block text-sm font-medium text-[#0f1e33]">Event Date *</label>
                  <div className="relative">
                    <Calendar size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                    <input id="date" type="date" value={date} onChange={setField(setDate)} className={cn(inputClass("date"), "pl-11")} />
                  </div>
                  {errors.date ? <p className="mt-2 text-sm text-rose-600">{errors.date}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f1e33]">Venue *</label>
                  <select value={venue} onChange={setField(setVenue)} className={inputClass("venue")}>
                    <option value="">Select venue</option>
                    {venues.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.venue ? <p className="mt-2 text-sm text-rose-600">{errors.venue}</p> : null}
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="startTime" className="mb-2 block text-sm font-medium text-[#0f1e33]">Start Time *</label>
                  <div className="relative">
                    <Clock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                    <input id="startTime" type="time" value={startTime} onChange={setField(setStartTime)} className={cn(inputClass("startTime"), "pl-11")} />
                  </div>
                  {errors.startTime ? <p className="mt-2 text-sm text-rose-600">{errors.startTime}</p> : null}
                </div>
                <div>
                  <label htmlFor="endTime" className="mb-2 block text-sm font-medium text-[#0f1e33]">End Time *</label>
                  <div className="relative">
                    <Clock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                    <input id="endTime" type="time" value={endTime} onChange={setField(setEndTime)} className={cn(inputClass("endTime"), "pl-11")} />
                  </div>
                  {errors.endTime ? <p className="mt-2 text-sm text-rose-600">{errors.endTime}</p> : null}
                </div>
              </div>
              {showTimeSuggestions ? (
                <div className="mt-5 rounded-2xl border border-[#d9e2ec] bg-[#f8fbff] p-4">
                  <p className="text-sm font-semibold text-[#0f1e33]">Suggested Time Slots</p>
                  <div className="mt-3 space-y-3">
                    {suggestedTimes.map((slot) => (
                      <button key={`${slot.startTime}-${slot.endTime}`} type="button" onClick={() => { setStartTime(slot.startTime); setEndTime(slot.endTime); setShowTimeSuggestions(false); setNotice({ type: "success", message: "Time suggestion applied." }); }} className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[#d9e2ec] bg-white p-4 text-left">
                        <div>
                          <p className="font-medium text-[#0f1e33]">{slot.startTime} - {slot.endTime}</p>
                          <p className="mt-1 text-sm text-[#6b7c93]">{slot.reason}</p>
                        </div>
                        <Check size={16} className="mt-1 text-[#1f4e79]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0f1e33]">Pricing</h2>
              <p className="mt-1 text-sm text-[#6b7c93]">Choose whether this event is free or paid.</p>
              <div className="mt-6 flex flex-col gap-4">
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#d9e2ec] px-4 py-4">
                  <div>
                    <p className="font-medium text-[#0f1e33]">Paid Event</p>
                    <p className="text-sm text-[#6b7c93]">Turn this on if attendees need to pay.</p>
                  </div>
                  <input type="checkbox" checked={isPaid} onChange={(event) => { setIsPaid(event.target.checked); if (!event.target.checked) setPrice(""); clearNotice(); }} className="h-5 w-5 rounded border-[#d9e2ec] text-[#f36f21] focus:ring-[#f36f21]" />
                </label>
                {isPaid ? (
                  <div>
                    <label htmlFor="price" className="mb-2 block text-sm font-medium text-[#0f1e33]">Ticket Price (AUD) *</label>
                    <div className="relative">
                      <DollarSign size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                      <input id="price" type="number" value={price} onChange={setField(setPrice)} placeholder="25" className={cn(inputClass("price"), "pl-11")} />
                    </div>
                    {errors.price ? <p className="mt-2 text-sm text-rose-600">{errors.price}</p> : null}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0f1e33]">Event Media</h2>
              <p className="mt-1 text-sm text-[#6b7c93]">Upload up to five images for your listing.</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(event) => { addImages(event.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="hidden" />
              <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }} onDrop={(event) => { event.preventDefault(); setIsDragging(false); addImages(event.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()} className={cn("mt-6 cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition", isDragging ? "border-[#f36f21] bg-[#fff1e8]" : "border-[#d9e2ec] hover:border-[#f36f21]")}>
                <Upload size={38} className={cn("mx-auto", isDragging ? "text-[#f36f21]" : "text-[#6b7c93]")} />
                <p className="mt-4 font-medium text-[#0f1e33]">{isDragging ? "Drop images here" : "Drag and drop images here"}</p>
                <p className="mt-1 text-sm text-[#6b7c93]">or click to browse files</p>
              </div>
              {uploadedImages.length ? (
                <div className="mt-6">
                  <p className="text-sm font-medium text-[#0f1e33]">Uploaded Images ({uploadedImages.length}/5)</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {uploadedImages.map((image, index) => (
                      <div key={`${image.file.name}-${index}`} className="relative overflow-hidden rounded-2xl border border-[#d9e2ec]">
                        <img src={image.preview} alt={`Upload ${index + 1}`} className="aspect-video w-full object-cover" />
                        <button type="button" onClick={(event) => { event.stopPropagation(); URL.revokeObjectURL(image.preview); setUploadedImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index)); }} className="absolute right-3 top-3 rounded-full bg-white p-2 text-[#0f1e33] shadow">
                          <X size={14} />
                        </button>
                        {index === 0 ? <span className="absolute left-3 top-3 rounded-full bg-[#f36f21] px-2 py-1 text-xs font-semibold text-white">Cover</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl bg-gradient-to-br from-[#eaf4ff] via-white to-[#fff4ec] p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-[#0f1e33]"><Sparkles size={20} className="text-[#1f4e79]" />AI Assistant</h2>
              <p className="mt-2 text-sm text-[#6b7c93]">Use the quick helpers to draft stronger event details.</p>
              <div className="mt-5 space-y-3">
                <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDescription} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f4e79] px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                  {isGeneratingDescription ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate Description
                </button>
                <button type="button" onClick={handleSuggestTime} disabled={isSuggestingTime} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-4 py-3 font-medium text-[#0f1e33] disabled:cursor-not-allowed disabled:opacity-70">
                  {isSuggestingTime ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                  Suggest Best Time
                </button>
                <button type="button" onClick={handleSuggestTags} disabled={isSuggestingTags} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-4 py-3 font-medium text-[#0f1e33] disabled:cursor-not-allowed disabled:opacity-70">
                  {isSuggestingTags ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
                  Suggest Tags
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0f1e33]">Tips for Success</h2>
              <ul className="mt-4 space-y-3 text-sm text-[#6b7c93]">
                <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-[#f36f21]" />Use a clear title that tells students what they will gain.</li>
                <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-[#f36f21]" />Add practical details so attendees know what to expect.</li>
                <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-[#f36f21]" />Select relevant tags to improve search and discovery.</li>
                <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-[#f36f21]" />Keep capacity realistic for the room and event format.</li>
              </ul>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0f1e33]">Quick Preview</h2>
              <div className="mt-4 rounded-2xl bg-[#f5f7fa] p-4">
                <h3 className="text-lg font-semibold text-[#0f1e33]">{title || "Event Title"}</h3>
                <p className="mt-2 text-sm text-[#6b7c93]">{description || "Your event description preview will appear here."}</p>
                <div className="mt-4 space-y-2 text-sm text-[#6b7c93]">
                  <div className="flex items-center gap-2"><Calendar size={14} /><span>{formatDisplayDate(date)}</span></div>
                  <div className="flex items-center gap-2"><Clock size={14} /><span>{startTime && endTime ? `${startTime} - ${endTime}` : "Select time"}</span></div>
                  <div className="flex items-center gap-2"><Users size={14} /><span>{capacity || "0"} seats</span></div>
                </div>
                {selectedTags.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedTags.map((item) => <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1f4e79]">{item}</span>)}
                  </div>
                ) : null}
                <p className="mt-4 text-sm font-semibold text-[#f36f21]">{isPaid && price ? `$${price} AUD` : "Free Event"}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OrganizerDashboard;
