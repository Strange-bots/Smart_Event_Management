import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Download, Search, Grid, List, Filter, X } from "lucide-react";
import { useState, useRef } from "react";
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

const initialGalleryImages = [
  {
    id: 1,
    title: "Annual Tech Summit 2024",
    date: "March 15, 2024",
    url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&q=80",
    category: "Conference",
  },
  {
    id: 2,
    title: "Business Workshop",
    date: "March 10, 2024",
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80",
    category: "Workshop",
  },
  {
    id: 3,
    title: "Graduation Ceremony",
    date: "February 28, 2024",
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80",
    category: "Ceremony",
  },
  {
    id: 4,
    title: "Career Fair",
    date: "February 20, 2024",
    url: "https://images.unsplash.com/photo-1559523182-a284c3fb7cff?w=400&q=80",
    category: "Fair",
  },
  {
    id: 5,
    title: "Networking Event",
    date: "February 15, 2024",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=80",
    category: "Networking",
  },
  {
    id: 6,
    title: "Leadership Seminar",
    date: "February 10, 2024",
    url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&q=80",
    category: "Seminar",
  },
];

const AdminGallery = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState(initialGalleryImages);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [uploadData, setUploadData] = useState({ title: "", category: "" });
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const toggleImageSelection = (id) => {
    setSelectedImages(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredImages = galleryImages.filter(img =>
    img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    if (!uploadData.title || !uploadData.category || !previewUrl) {
      toast.error("Please fill in all fields and select an image");
      return;
    }

    const newImage = {
      id: Date.now(),
      title: uploadData.title,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      url: previewUrl,
      category: uploadData.category,
    };

    setGalleryImages(prev => [newImage, ...prev]);
    setIsUploadDialogOpen(false);
    setUploadData({ title: "", category: "" });
    setPreviewUrl(null);
    toast.success("Image uploaded successfully!");
  };

  const handleDownload = (image) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.title.replace(/\s+/g, '-')}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${image.title}`);
  };

  const handleDeleteSingle = (id) => {
    setImageToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (imageToDelete) {
      setGalleryImages(prev => prev.filter(img => img.id !== imageToDelete));
      setSelectedImages(prev => prev.filter(id => id !== imageToDelete));
      toast.success("Image deleted successfully");
    }
    setIsDeleteDialogOpen(false);
    setImageToDelete(null);
  };

  const handleBulkDelete = () => {
    setGalleryImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
    toast.success(`${selectedImages.length} image(s) deleted successfully`);
    setSelectedImages([]);
  };

  return (
    <DashboardLayout userRole="admin" userName="Sachin Thapa">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
              Event Gallery
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage event photos and media files
            </p>
          </div>
          <Button variant="brand" className="gap-2" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload size={18} />
            Upload Images
          </Button>
        </div>

        {/* Toolbar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Filter size={18} />
                </Button>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid size={18} />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List size={18} />
                  </Button>
                </div>
                {selectedImages.length > 0 && (
                  <Button variant="destructive" size="sm" className="gap-2" onClick={handleBulkDelete}>
                    <Trash2 size={16} />
                    Delete ({selectedImages.length})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <Card
                key={image.id}
                className={cn(
                  "border-0 shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md",
                  selectedImages.includes(image.id) && "ring-2 ring-brand-orange"
                )}
                onClick={() => toggleImageSelection(image.id)}
              >
                <div className="aspect-video relative">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    >
                      <Download size={14} />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-foreground truncate">{image.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{image.date}</span>
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                      {image.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-secondary/50 cursor-pointer transition-colors",
                      selectedImages.includes(image.id) && "bg-brand-orange/5"
                    )}
                    onClick={() => toggleImageSelection(image.id)}
                  >
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{image.title}</h3>
                      <p className="text-sm text-muted-foreground">{image.date}</p>
                    </div>
                    <span className="text-xs px-3 py-1 bg-secondary rounded-full text-muted-foreground">
                      {image.category}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image);
                        }}
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingle(image.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>Add a new image to the gallery</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageTitle">Image Title</Label>
              <Input
                id="imageTitle"
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter image title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageCategory">Category</Label>
              <Input
                id="imageCategory"
                value={uploadData.category}
                onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Conference, Workshop"
              />
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
                  <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setPreviewUrl(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-brand-orange transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select an image</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminGallery;
