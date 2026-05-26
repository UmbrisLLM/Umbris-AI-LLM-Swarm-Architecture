"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/Button";
import { fadeUp } from "@/lib/motion";

export function CallToAction() {
  return (
    <section
      id="cta"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48"
      aria-label="Call to action"
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-eyebrow mb-6"
        >
          · Initiation ·
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-display text-umbris-lunar text-[clamp(2.5rem,7vw,5rem)] mb-10"
        >
          Join the Convocation
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-serif text-umbris-stellar text-xl italic mb-14 max-w-xl mx-auto leading-relaxed"
        >
          Every revolution is cast in public. The whitepaper is the source of truth. The convocation is open to seekers.
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button href="/now">Read the latest revolutions</Button>
          <Button
            href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/blob/main/docs/whitepaper.md"
            external
            variant="violet"
          >
            Read the Whitepaper
          </Button>
          <Button
            href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture"
            external
            variant="ghost"
          >
            The convocation on GitHub
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
