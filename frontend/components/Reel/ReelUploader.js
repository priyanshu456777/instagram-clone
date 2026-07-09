// frontend/components/Reel/ReelUploader.js — NEW FILE.

// Modal for uploading a new reel. Includes a video preview.


import { useState, useRef } from "react";

import { X, Video, Music } from "lucide-react";

import toast from "react-hot-toast";

import api from "../../lib/api";


const MAX_SIZE_MB = 50;

const MAX_DURATION_SEC = 90;


export default function ReelUploader({ onClose, onCreated }) {

  const [file, setFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState(null);

  const [caption, setCaption] = useState("");

  const [audio, setAudio] = useState("");

  const [duration, setDuration] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef(null);


  const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];


  const handleFile = (selected) => {

    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {

      toast.error("Only MP4, WebM or MOV videos are allowed");

      return;

    }

    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {

      toast.error(`Video must be under ${MAX_SIZE_MB}MB`);

      return;

    }

    setFile(selected);

    setPreviewUrl(URL.createObjectURL(selected));

  };


  const handleLoadedMetadata = () => {

    const v = videoRef.current;

    if (!v) return;

    setDuration(v.duration || 0);

    if (v.duration > MAX_DURATION_SEC) {

      toast.error(`Maximum reel length is ${MAX_DURATION_SEC}s`);

      setFile(null);

      setPreviewUrl(null);

    }

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!file) {

      toast.error("Please select a video first");

      return;

    }

    if (!caption.trim()) {

      toast.error("Caption is required");

      return;

    }

    setSubmitting(true);

    try {

      const formData = new FormData();

      formData.append("video", file);

      formData.append("caption", caption.trim());

      if (audio.trim()) formData.append("audio", audio.trim());

      const { data } = await api.post("/reels", formData, {

        headers: { "Content-Type": "multipart/form-data" },

      });

      toast.success("Reel shared!");

      onCreated?.(data.reel);

      onClose();

    } catch (err) {

      toast.error(err.message || "Upload failed");

    } finally {

      setSubmitting(false);

    }

  };


  const handleBackdropClick = (e) => {

    if (e.target === e.currentTarget) onClose();

  };


  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"

      onClick={handleBackdropClick}

    >

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 sticky top-0 bg-zinc-900 z-10">

          <h2 className="font-semibold text-white flex items-center gap-2">

            <Video size={18} /> New Reel

          </h2>

          <button

            onClick={onClose}

            className="text-zinc-400 hover:text-white"

            aria-label="Close"

          >

            <X size={20} />

          </button>

        </div>


        <form onSubmit={handleSubmit} className="p-4 space-y-4">

          {previewUrl ? (

            <div className="relative w-full max-h-[420px] aspect-[9/16] bg-black rounded-lg overflow-hidden mx-auto">

              <video

                ref={videoRef}

                src={previewUrl}

                onLoadedMetadata={handleLoadedMetadata}

                className="w-full h-full object-contain"

                controls

              />

            </div>

          ) : (

            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">

              <Video size={48} className="text-zinc-500 mb-2" />

              <span className="text-sm text-zinc-400">Click to select a video</span>

              <span className="text-xs text-zinc-500 mt-1">

                MP4 / WebM / MOV · max {MAX_SIZE_MB}MB · max {MAX_DURATION_SEC}s

              </span>

              <input

                type="file"

                accept="video/*"

                className="hidden"

                onChange={(e) => handleFile(e.target.files?.[0])}

              />

            </label>

          )}


          <div>

            <textarea

              value={caption}

              onChange={(e) => setCaption(e.target.value)}

              placeholder="Write a caption... use #hashtags and @mentions"

              maxLength={2200}

              rows={3}

              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-500"

            />

            {duration > 0 && (

              <p className="text-xs text-zinc-500 mt-1 text-right">

                Duration: {duration.toFixed(1)}s

              </p>

            )}

          </div>


          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">

            <Music size={16} className="text-zinc-400" />

            <input

              type="text"

              value={audio}

              onChange={(e) => setAudio(e.target.value)}

              placeholder="Add audio track (optional)"

              maxLength={100}

              className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-zinc-500"

            />

          </div>


          <button

            type="submit"

            disabled={submitting || !file}

            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-medium"

          >

            {submitting ? "Uploading..." : "Share Reel"}

          </button>

        </form>

      </div>

    </div>

  );

}

