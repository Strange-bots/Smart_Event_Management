import { useEffect, useRef, useState } from "react";

import DashboardLayout from "../../components/dashboard/dashboard.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Download, Search, Grid, List, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteAdminGalleryImage,
  fetchAdminGalleryImages,
  uploadAdminGalleryImage,
} from "@/services/adminGalleryService.js";
import { fetchAdminEvents } from "@/services/adminEventService.js";

const formatDateLabel = (dateString) => {
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });

const mapGalleryImage = (image) => ({
  id: image.id,
  eventId: image.eventId,
  title: image.title,
  date: formatDateLabel(image.date),
  url: image.url,
  category: image.category || "General",
  organizerName: image.organizerName || "Event Organizer",
});

const AdminGallery = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [adminEvents, setAdminEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadData, setUploadData] = useState({ eventId: "" });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      const [images, events] = await Promise.all([
        fetchAdminGalleryImages(),
        fetchAdminEvents(),
      ]);
      setGalleryImages(images.map(mapGalleryImage));
      setAdminEvents(events);
      setError("");
    } catch (loadError) {
      setGalleryImages([]);
      setAdminEvents([]);
      setError(loadError.message || "Unable to load gallery data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const toggleImageSelection = (id) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredImages = galleryImages.filter(
    (image) =>
      image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.organizerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableEvents = adminEvents.filter((event) => !event.image && !event.imagePreview);

  const resetUploadState = () => {
    setUploadData({ eventId: "" });
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!uploadData.eventId || !selectedFile) {
      toast.error("Please select an event and choose an image.");
      return;
    }

    try {
      setIsUploading(true);
      const imageData = await fileToDataUrl(selectedFile);
      await uploadAdminGalleryImage(uploadData.eventId, imageData);
      await loadGallery();
      setIsUploadDialogOpen(false);
      resetUploadState();
      toast.success("Image uploaded successfully!");
    } catch (uploadError) {
      toast.error(uploadError.message || "Could not upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (image) => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `${image.title.replace(/\s+/g, "-")}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${image.title}`);
  };

  const handleDeleteSingle = (eventId) => {
    setImageToDelete(eventId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAdminGalleryImage(imageToDelete);
      await loadGallery();
      setSelectedImages((prev) => prev.filter((id) => id !== String(imageToDelete)));
      toast.success("Image deleted successfully");
    } catch (deleteError) {
      toast.error(deleteError.message || "Could not delete image.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true);
      await Promise.all(selectedImages.map((eventId) => deleteAdminGalleryImage(eventId)));
      await loadGallery();
      toast.success(`${selectedImages.length} image(s) deleted successfully`);
      setSelectedImages([]);
    } catch (deleteError) {
      toast.error(deleteError.message || "Could not delete selected images.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-primary md:text-3xl">
              Event Gallery
            </h1>
            <p className="mt-1 text-muted-foreground">
              Review and manage event media uploaded for organizer events.
            </p>
          </div>
          <Button
            variant="brand"
            className="gap-2 bg-[#f36f21] text-white hover:bg-[#ff8a3d]"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Upload size={18} />
            Upload Images
          </Button>
        </div>

        {error ? (
          <Card className="border border-rose-200 bg-rose-50 shadow-sm">
            <CardContent className="p-4 text-sm text-rose-700">{error}</CardContent>
          </Card>
        ) : null}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="relative max-w-md flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                >
                  <Filter size={18} />
                </Button>
                <div className="flex rounded-lg border">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "rounded-r-none",
                      viewMode === "grid"
                        ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                        : "hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                    )}
                  >
                    <Grid size={18} />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "rounded-l-none",
                      viewMode === "list"
                        ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                        : "hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                    )}
                  >
                    <List size={18} />
                  </Button>
                </div>
                {selectedImages.length > 0 ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} />
                    Delete ({selectedImages.length})
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              <Card className="col-span-full border-0 shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading gallery images...
                </CardContent>
              </Card>
            ) : filteredImages.length === 0 ? (
              <Card className="col-span-full border-0 shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No gallery images found.
                </CardContent>
              </Card>
            ) : (
              filteredImages.map((image) => (
                <Card
                  key={image.id}
                  className={cn(
                    "cursor-pointer overflow-hidden border-0 shadow-sm transition-all hover:shadow-md",
                    selectedImages.includes(image.id) && "ring-2 ring-brand-orange"
                  )}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDownload(image);
                        }}
                      >
                        <Download size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteSingle(image.eventId);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="truncate font-medium text-foreground">{image.title}</h3>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{image.date}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {image.category}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading gallery images...
                  </div>
                ) : filteredImages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No gallery images found.
                  </div>
                ) : (
                  filteredImages.map((image) => (
                    <div
                      key={image.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-secondary/50",
                        selectedImages.includes(image.id) && "bg-brand-orange/5"
                      )}
                      onClick={() => toggleImageSelection(image.id)}
                    >
                      <img
                        src={image.url}
                        alt={image.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{image.title}</h3>
                        <p className="text-sm text-muted-foreground">{image.date}</p>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                        {image.category}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDownload(image);
                          }}
                        >
                          <Download size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSingle(image.eventId);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) {
            resetUploadState();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Add an image to an organizer event that does not yet have gallery media.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="galleryEvent">Event</Label>
              <select
                id="galleryEvent"
                value={uploadData.eventId}
                onChange={(event) =>
                  setUploadData((prev) => ({ ...prev, eventId: event.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select an event</option>
                {availableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Image File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="h-40 w-full rounded-lg object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div
                  className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-brand-orange"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select an image</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminGallery;
