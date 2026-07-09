// frontend/pages/reels.js — NEW FILE.

// Vertical full-screen reels feed, Instagram-style.


import { useEffect, useRef, useState, useCallback } from "react";

import { useRouter } from "next/router";

import { Plus } from "lucide-react";

import Layout from "../components/Layout/Layout";

import ReelItem from "../components/Reel/ReelItem";

import ReelUploader from "../components/Reel/ReelUploader";

import { useAuth } from "../context/AuthContext";

import api from "../lib/api";

import toast from "react-hot-toast";


export default function ReelsPage() {

  const router = useRouter();

  const { user: currentUser } = useAuth();

  const [reels, setReels] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeIdx, setActiveIdx] = useState(0);

  const [showUploader, setShowUploader] = useState(false);

  const feedRef = useRef(null);


  const loadFeed = useCallback(async () => {

    try {

      const { data } = await api.get("/reels");

      setReels(data.reels || []);

    } catch (err) {

      toast.error(err.message || "Failed to load reels");

    } finally {

      setLoading(false);

    }

  }, []);


  useEffect(() => {

    loadFeed();

  }, [loadFeed]);


  // IntersectionObserver to detect which reel is currently visible.

  useEffect(() => {

    if (!feedRef.current || reels.length === 0) return;

    const observer = new IntersectionObserver(

      (entries) => {

        const visible = entries

          .filter((e) => e.isIntersecting)

          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {

          const idx = Number(visible[0].target.dataset.idx);

          if (!Number.isNaN(idx)) setActiveIdx(idx);

        }

      },

      { threshold: [0.5, 0.8] }

    );

    const items = feedRef.current.querySelectorAll("[data-reel-item]");

    items.forEach((el) => observer.observe(el));

    return () => observer.disconnect();

  }, [reels]);


  const handleCreated = (newReel) => {

    setReels((r) => [newReel, ...r]);

  };


  const handleDeleted = (id) => {

    setReels((r) => r.filter((x) => x._id !== id));

  };


  return (

    <Layout>

      <div className="relative bg-black" style={{ height: "calc(100vh - 56px)" }}>

        {/* Top bar */}

        <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 flex items-center justify-between pointer-events-none">

          <h1 className="text-white font-bold text-lg pointer-events-auto">Reels</h1>

          {currentUser && (

            <button

              onClick={() => setShowUploader(true)}

              className="bg-white text-black rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1 pointer-events-auto hover:bg-zinc-200 transition-colors"

            >

              <Plus size={16} /> New

            </button>

          )}

        </div>


        {loading ? (

          <div className="flex items-center justify-center h-full text-white">

            <div className="w-10 h-10 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />

          </div>

        ) : reels.length === 0 ? (

          <div className="flex flex-col items-center justify-center h-full text-white">

            <div className="text-7xl mb-4">🎬</div>

            <p className="text-xl font-semibold mb-2">No reels yet</p>

            <p className="text-zinc-400 text-sm max-w-sm text-center mb-6">

              Be the first to share a short video. Upload up to 90s and watch it pop up here.

            </p>

            {currentUser && (

              <button

                onClick={() => setShowUploader(true)}

                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium"

              >

                Create your first Reel

              </button>

            )}

          </div>

        ) : (

          <div

            ref={feedRef}

            className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"

          >

            {reels.map((reel, idx) => (

              <div

                key={reel._id}

                data-reel-item

                data-idx={idx}

                className="h-full w-full"

              >

                <ReelItem

                  reel={reel}

                  currentUser={currentUser}

                  isActive={idx === activeIdx}

                  onDeleted={handleDeleted}

                />

              </div>

            ))}

          </div>

        )}


        {showUploader && (

          <ReelUploader

            onClose={() => setShowUploader(false)}

            onCreated={handleCreated}

          />

        )}

      </div>


      <style jsx global>{`

        .scrollbar-hide::-webkit-scrollbar {

          display: none;

        }

        .scrollbar-hide {

          -ms-overflow-style: none;

          scrollbar-width: none;

        }

        @keyframes ping-once {

          0% { transform: scale(0); opacity: 0; }

          20% { transform: scale(1.3); opacity: 1; }

          80% { transform: scale(1); opacity: 1; }

          100% { transform: scale(1.3); opacity: 0; }

        }

        .animate-ping-once {

          animation: ping-once 900ms ease-out forwards;

        }

      `}</style>

    </Layout>

  );

}

