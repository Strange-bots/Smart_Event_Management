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
import {
  createOrganizerEvent,
  generateOrganizerEventDescription,
  generateOrganizerEventImages,
  suggestOrganizerEventTags,
  suggestOrganizerEventTimes,
} from "../../services/organizerEventService.js";

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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
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
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedGeneratedImageId, setSelectedGeneratedImageId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isSuggestingTime, setIsSuggestingTime] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);

  useEffect(() => () => {
    uploadedImages.forEach((image) => URL.revokeObjectURL(image.preview));
  }, [uploadedImages]);

  const selectedGeneratedImage =
    generatedImages.find((image) => image.id === selectedGeneratedImageId) || null;
  const previewImages =
    uploadedImages.length > 0
      ? uploadedImages.map((image, index) => ({
          id: `upload-${index}`,
          src: image.preview,
          label: index === 0 ? "Uploaded cover" : `Upload ${index + 1}`,
        }))
      : generatedImages.map((image) => ({
          id: image.id,
          src: image.imageDataUrl,
          label: image.label,
        }));

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
    setSelectedGeneratedImageId("");
    setNotice({ type: "success", message: `${nextImages.length} image(s) added successfully.` });
  };

  const handleGenerateImages = async ({ refresh = false } = {}) => {
    if (!title.trim() || !description.trim()) {
      setNotice({
        type: "error",
        message: "Add the event title and description before generating AI images.",
      });
      return;
    }

    setIsGeneratingImages(true);
    clearNotice();

    try {
      const result = await generateOrganizerEventImages({
        title,
        description,
        category,
        venue,
        date,
        isPaid,
        tags: selectedTags,
        limit: 3,
      });

      if (!result.images.length) {
        setNotice({
          type: "error",
          message: result.modelResult || "No images were generated. Please try again.",
        });
        return;
      }

      setGeneratedImages(result.images);
      setSelectedGeneratedImageId(result.images[0].id);
      setNotice({
        type: "success",
        message:
          result.source === "gemini"
            ? refresh
              ? "Generated a new set of AI event images."
              : "AI event images are ready."
            : result.reason === "quota_exceeded"
              ? "Gemini image quota is currently exhausted. Fallback images were generated instead."
              : `Generated fallback event images${result.reason ? `: ${result.reason}` : ""}.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Unable to generate event images.",
      });
    } finally {
      setIsGeneratingImages(false);
    }
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
    try {
      const result = await generateOrganizerEventDescription({
        title,
        category,
        venue,
        capacity,
        isPaid,
        price,
        tags: selectedTags,
      });
      setDescription(result.description);
      setErrors((prev) => ({ ...prev, description: "" }));
      setNotice({
        type: "success",
        message:
          result.source === "gemini"
            ? "Description generated successfully."
            : `Description generated using server fallback${result.reason ? `: ${result.reason}` : ""}.`,
      });
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Unable to generate description." });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSuggestTime = async () => {
    if (!category) return setNotice({ type: "error", message: "Select a category first." });
    setIsSuggestingTime(true);
    clearNotice();
    try {
      const result = await suggestOrganizerEventTimes({
        category,
        venue,
        date,
      });
      setSuggestedTimes(result.suggestions);
      setShowTimeSuggestions(Boolean(result.suggestions.length));
      setNotice({
        type: "success",
        message:
          result.source === "gemini"
            ? "Suggested time slots are ready."
            : `Time suggestions generated using server fallback${result.reason ? `: ${result.reason}` : ""}.`,
      });
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Unable to suggest time slots." });
    } finally {
      setIsSuggestingTime(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!title.trim() && !category) return setNotice({ type: "error", message: "Add a title or choose a category first." });
    setIsSuggestingTags(true);
    clearNotice();
    try {
      const result = await suggestOrganizerEventTags({
        title,
        category,
        selectedTags,
      });
      const tagsToAdd = result.tags
        .filter((tag) => !selectedTags.includes(tag))
        .slice(0, 5 - selectedTags.length);

      if (!tagsToAdd.length) {
        setNotice({
          type: "error",
          message: result.reason
            ? `No new tag suggestions were found. Backend reason: ${result.reason}`
            : "No new tag suggestions were found.",
        });
      } else {
        setSelectedTags((prev) => [...prev, ...tagsToAdd]);
        setErrors((prev) => ({ ...prev, tags: "" }));
        setNotice({
          type: "success",
          message:
            result.source === "gemini"
              ? `Added ${tagsToAdd.length} suggested tag(s).`
              : `Added ${tagsToAdd.length} fallback tag suggestion(s)${result.reason ? `: ${result.reason}` : ""}.`,
        });
      }
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Unable to suggest tags." });
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleSubmit = async () => {
    clearNotice();
    if (!validateForm()) return setNotice({ type: "error", message: "Please fix the required fields first." });

    setIsSubmitting(true);

    try {
      let imagePreview = await readFileAsDataUrl(uploadedImages[0]?.file);

      if (!imagePreview && selectedGeneratedImage?.imageDataUrl) {
        imagePreview = selectedGeneratedImage.imageDataUrl;
      }

      if (!imagePreview) {
        const generatedResult = await generateOrganizerEventImages({
          title,
          description,
          category,
          venue,
          date,
          isPaid,
          tags: selectedTags,
          limit: 1,
        });
        imagePreview = generatedResult.images?.[0]?.imageDataUrl || "";
      }

      await createOrganizerEvent({
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
        imagePreview,
      });

      uploadedImages.forEach((image) => URL.revokeObjectURL(image.preview));
      setDate(""); setTitle(""); setDescription(""); setCategory(""); setVenue(""); setCapacity("");
      setStartTime(""); setEndTime(""); setIsPaid(false); setPrice(""); setSelectedTags([]); setTagInput("");
      setUploadedImages([]); setGeneratedImages([]); setSelectedGeneratedImageId("");
      setErrors({}); setSuggestedTimes([]); setShowTimeSuggestions(false);
      setNotice({ type: "success", message: "Event submitted for admin approval." });
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Unable to submit event." });
    } finally {
      setIsSubmitting(false);
    }
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
            <button
              type="button"
              onClick={() => {
                if (!title.trim() || !description.trim() || !category || !capacity || !venue || !date) {
                  setNotice({ type: "error", message: "Please fill in all required fields before previewing." });
                  return;
                }
                clearNotice();
                setShowPreview(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] px-4 py-2.5 font-medium text-[#0f1e33]"
            >
              <Eye size={18} />
              Preview
            </button>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
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
              <p className="mt-1 text-sm text-[#6b7c93]">Upload your own images or generate AI cover images for the event.</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(event) => { addImages(event.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="hidden" />
              <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }} onDrop={(event) => { event.preventDefault(); setIsDragging(false); addImages(event.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()} className={cn("mt-6 cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition", isDragging ? "border-[#f36f21] bg-[#fff1e8]" : "border-[#d9e2ec] hover:border-[#f36f21]")}>
                <Upload size={38} className={cn("mx-auto", isDragging ? "text-[#f36f21]" : "text-[#6b7c93]")} />
                <p className="mt-4 font-medium text-[#0f1e33]">{isDragging ? "Drop images here" : "Drag and drop images here"}</p>
                <p className="mt-1 text-sm text-[#6b7c93]">or click to browse files</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleGenerateImages({ refresh: generatedImages.length > 0 })}
                  disabled={isGeneratingImages}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] px-4 py-2.5 text-sm font-medium text-[#1f4e79] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGeneratingImages ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {generatedImages.length > 0 ? "Generate Different Pictures" : "Generate AI Pictures"}
                </button>
                <p className="self-center text-xs text-[#6b7c93]">
                  If you skip uploads, the selected AI image will be used as the event cover.
                </p>
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
              {generatedImages.length ? (
                <div className="mt-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-[#0f1e33]">AI Generated Options</p>
                    <p className="text-xs text-[#6b7c93]">Choose the image that best fits your event.</p>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {generatedImages.map((image) => {
                      const isSelected = selectedGeneratedImageId === image.id;

                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => {
                            setSelectedGeneratedImageId(image.id);
                            clearNotice();
                          }}
                          className={cn(
                            "relative overflow-hidden rounded-2xl border text-left transition",
                            isSelected
                              ? "border-[#f36f21] ring-2 ring-[#f36f21]/25"
                              : "border-[#d9e2ec] hover:border-[#1f4e79]",
                          )}
                        >
                          <img src={image.imageDataUrl} alt={image.label} className="aspect-video w-full object-cover" />
                          <div className="flex items-center justify-between bg-white px-3 py-2">
                            <span className="text-sm font-medium text-[#0f1e33]">{image.label}</span>
                            {isSelected ? (
                              <span className="rounded-full bg-[#f36f21] px-2 py-1 text-[11px] font-semibold text-white">
                                Selected
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
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
                <button type="button" onClick={() => handleGenerateImages({ refresh: generatedImages.length > 0 })} disabled={isGeneratingImages} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9e2ec] bg-white px-4 py-3 font-medium text-[#0f1e33] disabled:cursor-not-allowed disabled:opacity-70">
                  {isGeneratingImages ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {generatedImages.length > 0 ? "Generate Different Pictures" : "Generate AI Pictures"}
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
                {previewImages.length ? (
                  <img
                    src={previewImages[0].src}
                    alt="Event preview"
                    className="mb-4 aspect-video w-full rounded-2xl object-cover"
                  />
                ) : null}
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

      {showPreview ? (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{ backgroundColor: "white", borderRadius: "12px", maxWidth: "700px", width: "90%", maxHeight: "85vh", overflowY: "auto", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ backgroundColor: "#1f4e79", borderRadius: "12px 12px 0 0", padding: "24px 32px" }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Event Preview</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">{title}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ backgroundColor: "#f36f21", color: "white", borderRadius: "999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600 }}>
                    Pending Approval
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "999px", padding: "6px", cursor: "pointer", color: "white", display: "flex" }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "32px" }}>
              {/* Image thumbnails */}
              {previewImages.length > 0 ? (
                <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
                  {previewImages.map((img, i) => (
                    <img
                      key={img.id}
                      src={img.src}
                      alt={`Preview ${i + 1}`}
                      style={{ height: "110px", width: "160px", objectFit: "cover", borderRadius: "10px", flexShrink: 0, border: "2px solid #d9e2ec" }}
                    />
                  ))}
                </div>
              ) : null}

              {/* Title + category */}
              <div className="flex flex-wrap items-start gap-3">
                <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#0f1e33", margin: 0 }}>{title}</h3>
                <span style={{ backgroundColor: "#fff1e8", color: "#f36f21", borderRadius: "999px", padding: "4px 14px", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {category}
                </span>
              </div>

              {/* Description */}
              <p style={{ marginTop: "14px", color: "#6b7c93", lineHeight: 1.7, fontSize: "14px" }}>{description}</p>

              {/* Date / Time row */}
              <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Date", value: formatDisplayDate(date) },
                  { label: "Start Time", value: startTime || "—" },
                  { label: "End Time", value: endTime || "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ backgroundColor: "#f5f7fa", borderRadius: "10px", padding: "14px 16px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7c93", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f1e33", marginTop: "4px" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Venue / Capacity row */}
              <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Venue", value: venue || "—" },
                  { label: "Capacity", value: capacity ? `${capacity} seats` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ backgroundColor: "#f5f7fa", borderRadius: "10px", padding: "14px 16px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7c93", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f1e33", marginTop: "4px" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#6b7c93" }}>Price:</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#f36f21" }}>
                  {isPaid && price ? `$${price} AUD` : "Free"}
                </span>
              </div>

              {/* Tags */}
              {selectedTags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span key={tag} style={{ backgroundColor: "#eaf4ff", color: "#1f4e79", borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: 500 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Action buttons */}
              <div style={{ marginTop: "28px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  style={{ padding: "10px 24px", borderRadius: "10px", border: "2px solid #1f4e79", background: "white", color: "#1f4e79", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPreview(false); handleSubmit(); }}
                  style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "#f36f21", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}
                >
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default OrganizerDashboard;
