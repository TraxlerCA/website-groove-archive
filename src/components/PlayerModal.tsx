'use client';
import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "@/context/PlayerProvider";
import { ytid } from "@/lib/utils";

const YouTubeFrame=({url}:{url:string})=>{const id=ytid(url)||""; const origin=typeof window!=="undefined"?window.location.origin:""; const src=`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&origin=${encodeURIComponent(origin)}`; return <iframe title="YouTube player" src={src} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>;};
const SoundCloudFrame=({url}:{url:string})=>{const src=`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=true`; return <iframe title="SoundCloud player" src={src} className="w-full h-full" allow="autoplay; encrypted-media"/>;};

export default function PlayerModal(){
  const { current, open, setOpen }=usePlayer();
  return (<AnimatePresence>{open&&current&&(<motion.div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm grid place-items-center p-4" onClick={()=>setOpen(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <motion.div className="w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl" onClick={e=>e.stopPropagation()} initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} exit={{y:10,opacity:0}}>
      {current.provider==="youtube"?<YouTubeFrame url={current.row.youtube!}/>:<SoundCloudFrame url={current.row.soundcloud!}/>}
    </motion.div></motion.div>)}</AnimatePresence>);
}
