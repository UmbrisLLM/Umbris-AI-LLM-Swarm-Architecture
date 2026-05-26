"use client";

import { motion } from "framer-motion";
import { Divider } from "./ui/Divider";
import { fadeUp } from "@/lib/motion";

export function Manifesto() {
  return (
    <section
      id="manifesto"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48"
      aria-label="Manifesto"
    >
      <div className="mx-auto max-w-[720px]">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={fadeUp}
          className="umbris-eyebrow mb-8 text-center"
        >
          §1 · The Convocation
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.18 } },
          }}
          className="umbris-serif text-umbris-lunar text-[1.25rem] leading-relaxed space-y-7"
        >
          <motion.p variants={fadeUp} className="umbris-dropcap">
            UMBRIS is not a model. It is a convocation.
          </motion.p>

          <motion.p variants={fadeUp}>
            A single language model, however large, reasons in one voice. It casts one shadow. It cannot meaningfully disagree with itself, cannot triangulate, cannot be falsified except from outside.
          </motion.p>

          <motion.p variants={fadeUp}>
            We replace that lonely soliloquy with a structured convocation. Nine planetary intelligences argue on a shared substrate · the <em>Umbra</em>, an append-only event log that is at once memory, message bus, and witness. <em>Mercurius</em> scouts, <em>Venus</em> gathers, <em>Mars</em> challenges, <em>Sol</em> synthesises, <em>Luna</em> maps the path, <em>Caelum</em> acts. The convocation does not speak. It writes.
          </motion.p>

          <motion.p variants={fadeUp}>
            When the convocation has cast enough shadows, three stages of consensus run. Weighted Borda aggregation surfaces a candidate vision across the worker rankings. <em>Iuppiter</em> adjudicates near-ties as the discerning king. <em>Saturnus</em> attempts to <em>falsify</em> what survives. If falsification succeeds, the convocation re-deliberates with the failure as a new constraint. The loop is bounded. The convocation does not lie about its certainty.
          </motion.p>

          <motion.p variants={fadeUp} className="text-umbris-stellar italic">
            Ex umbris in lumen. Dissolve a single shadow into many; recombine the many into one verified vision. That is the convocation.
          </motion.p>
        </motion.div>

        <Divider className="mt-20" width="100px" />
      </div>
    </section>
  );
}
