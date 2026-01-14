import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is JustOne?",
    answer: "JustOne is a campus-only matching platform that introduces you to one compatible person per cycle, based on who you are and what kind of relationship you want right now.",
  },
  {
    question: "Is this only for serious relationships?",
    answer: "No. JustOne is for people who value clarity. Some are looking for long-term relationships, some for something short-term, and some are open to seeing where things go. We respect all of it and match accordingly.",
  },
  {
    question: "How is this different from dating apps?",
    answer: "Dating apps push volume and swiping. JustOne removes the noise. No endless profiles, no games, no pressure to perform: just one thoughtful introduction at a time.",
  },
  {
    question: "How does matching work?",
    answer: "You complete a short questionnaire. Our system looks for the strongest alignment between people on the same campus — across values, preferences, and relationship intent.",
  },
  {
    question: "Is it anonymous?",
    answer: "Yes. Until there's mutual interest, both people remain anonymous.",
  },
  {
    question: "What if I don't get a match?",
    answer: "Not everyone gets matched every cycle. We'd rather give you no match than the wrong one. If no match is found for you in a cycle, you'll receive a full refund for that cycle.",
  },
  {
    question: "What if my match doesn't pay?",
    answer: "If you're matched with someone but they don't complete their payment, you'll receive a full refund. You only pay when both parties confirm.",
  },
  {
    question: "When are matches revealed?",
    answer: "At a fixed time during each cycle — and only if both people opt in.",
  },
  {
    question: "Is my data safe?",
    answer: "Yes. We don't sell data, we don't show ads, and your responses are never shared.",
  },
  {
    question: "Is this a public launch?",
    answer: "No. JustOne is running a private pilot on select campuses.",
  },
];

const FAQ = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section ref={ref} className="section-spacing px-6 relative overflow-hidden">
      {/* Layered warm background */}
      <div className="absolute inset-0 bg-card/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      <div className="section-container relative">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={isVisible ? { opacity: 1, width: 48 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="divider-thin mb-8" 
          />
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">
            FAQs
          </h2>
        </motion.div>

        {/* FAQ accordion */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="multiple" className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-b border-border/40 hover:border-primary/20 transition-colors duration-500"
              >
                <AccordionTrigger className="font-serif text-lg text-foreground hover:text-primary hover:no-underline py-5 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-light text-sm leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
