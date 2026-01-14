import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
    answer: "Matches will be revealed on Valentine's Day when you pay ₹299. This ensures everyone is serious about meeting their match.",
  },
  {
    question: "Is my data safe?",
    answer: "Yes. We don't sell data, we don't show ads, and your responses are never shared.",
  },
  {
    question: "Is this a public launch?",
    answer: "No. JustOne is running a private pilot on select campuses.",
  },
  {
    question: "How much does it cost?",
    answer: "Completing the questionnaire is free. To reveal your match on Valentine's Day, it costs ₹299.",
  },
];

const FAQPage = () => {
  return (
    <main className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="divider-thin mb-8 mx-auto" />
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl mx-auto">
            Everything you need to know about JustOne
          </p>
        </motion.div>

        {/* FAQ accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="multiple" className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/60 rounded-sm bg-card/50 px-6"
              >
                <AccordionTrigger className="font-serif text-lg text-foreground hover:text-primary hover:no-underline py-5 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-medium text-base leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </main>
  );
};

export default FAQPage;
