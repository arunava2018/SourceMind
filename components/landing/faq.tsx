import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function FAQ() {
  const faqs = [
    {
      question: "What types of files can I upload?",
      answer:
        "ChaibookLM currently supports PDF documents, plain text files, YouTube video URLs (we extract the transcript), website URLs, and VTT/SRT transcript files. More formats are on the roadmap.",
    },
    {
      question: "Are my sources private and secure?",
      answer:
        "Absolutely. All sources are siloed within their respective notebooks. Other users cannot access your notebooks, and queries in one notebook never pull information from another.",
    },
    {
      question: "How accurate are the citations?",
      answer:
        "Our system uses retrieval-augmented generation (RAG). Every answer is strictly grounded in the text chunks retrieved from your sources. The citation badges link directly to the exact chunk used — so you can always verify.",
    },
    {
      question: "Is there a limit to how many sources I can add?",
      answer:
        "You can add up to 50 sources per notebook on the free tier. Each individual file must be under 50MB. Need more? Reach out for enterprise options.",
    },
    {
      question: "Can I use ChaibookLM for team research?",
      answer:
        "Currently, ChaibookLM is designed for individual use. Team and collaboration features — including shared notebooks and role-based access — are on our roadmap.",
    },
  ]

  return (
    <section id="faq" className="border-t bg-muted/20 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Everything you need to know about using ChaibookLM.
          </p>
        </div>

        <Accordion className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
