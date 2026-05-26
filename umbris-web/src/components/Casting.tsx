"use client";

import { motion } from "framer-motion";
import { Divider } from "./ui/Divider";
import { fadeUp } from "@/lib/motion";

export function Casting() {
  return (
    <section
      id="casting"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48"
      aria-label="The Casting"
    >
      <div className="mx-auto max-w-[720px]">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-eyebrow mb-4 text-center"
        >
          §5 · Philosophy
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-display text-umbris-lunar text-[clamp(2rem,5vw,3.5rem)] text-center mb-16"
        >
          The Casting
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={{ visible: { transition: { staggerChildren: 0.18 } } }}
          className="umbris-serif text-umbris-lunar text-[1.18rem] leading-relaxed space-y-7"
        >
          <motion.h3 variants={fadeUp} className="umbris-display text-umbris-violet text-xl mb-2">
            Why a convocation?
          </motion.h3>
          <motion.p variants={fadeUp}>
            A convocation triangulates. A lone agent does not. The cheapest unit of useful disagreement is two planets reading the same Umbra and casting different shadows. Once you have that, you can weight, you can adjudicate, you can falsify. Cognition becomes legible.
          </motion.p>

          <motion.blockquote
            variants={fadeUp}
            className="border-l-2 border-umbris-violet pl-6 my-10 umbris-serif text-umbris-violet text-2xl italic leading-snug"
          >
            &ldquo;Dissolve the single shadow into many. Recombine the many into one verified vision.&rdquo;
          </motion.blockquote>

          <motion.h3 variants={fadeUp} className="umbris-display text-umbris-violet text-xl mb-2 mt-12">
            Lineage
          </motion.h3>
          <motion.p variants={fadeUp}>
            UMBRIS stands on four traditions. <em>Giordano Bruno&rsquo;s De Umbris Idearum</em> (1582) · the doctrine that ideas are shadows, triangulable only across many casts. <em>Ramon Llull&rsquo;s Ars Magna</em> (1305) · combinatorial generation under a falsifier. <em>Pierre-Paul Grassé</em> (1959) · stigmergy, the principle that termites and now agents coordinate by modifying their environment. <em>Hearsay-II</em> (CMU, 1971&ndash;1976) · the first blackboard architecture for cooperative cognition.
          </motion.p>

          <motion.h3 variants={fadeUp} className="umbris-display text-umbris-violet text-xl mb-2 mt-12">
            Ars Memoriae
          </motion.h3>
          <motion.p variants={fadeUp}>
            We do not claim novelty in the parts. We claim attention to the whole · combinatorial generation, shared substrate, stigmergic coordination, bounded falsification · applied to large language models with engineering discipline. <em>Ex umbris in lumen.</em>
          </motion.p>
        </motion.div>

        <Divider className="mt-20" width="100px" />
      </div>
    </section>
  );
}
