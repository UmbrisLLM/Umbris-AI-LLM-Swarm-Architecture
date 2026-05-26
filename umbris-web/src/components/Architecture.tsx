"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Divider } from "./ui/Divider";
import { fadeUp } from "@/lib/motion";

// The 3D planetary system is heavy (R3F + bloom). Load client-only so
// SSR doesn't try to render WebGL.
const PlanetarySystem3D = dynamic(
  () => import("./PlanetarySystem3D").then((m) => m.PlanetarySystem3D),
  { ssr: false, loading: () => <div style={{ height: 560 }} /> },
);

export function Architecture() {
  return (
    <section
      id="architecture"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48"
      aria-label="The Convocation"
    >
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-eyebrow mb-4 text-center"
        >
          §3 · The Convocation
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-display text-umbris-lunar text-[clamp(2rem,5vw,3.5rem)] text-center mb-4"
        >
          The Convocation
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-serif italic text-umbris-stellar text-center max-w-xl mx-auto mb-10"
        >
          Eight planetary intelligences in orbit around the Umbra. Move the
          cursor across the system to find each one.
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={fadeUp}
        >
          <PlanetarySystem3D
            height={560}
            emptyPrompt="move the cursor across the system to surface a planet"
          />
        </motion.div>

        <Divider className="mt-20" width="100px" />
      </div>
    </section>
  );
}
