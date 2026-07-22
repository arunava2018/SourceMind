import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion" // Need to install this component

export function FAQ() {
  const faqs = [
    {
      question: "What types of files can I upload?",
      answer: "ChaibookLM currently supports PDF documents, plain text files, YouTube video URLs (we extract the transcript), website URLs, and VTT/SRT transcript files."
    },
    {
      question: "Are my sources private?",
      answer: "Yes, all sources are siloed within their respective notebooks. Other users cannot access your notebooks, and queries in one notebook do not pull information from another."
    },
    {
      question: "How accurate are the citations?",
      answer: "Our system uses advanced retrieval-augmented generation (RAG). Every answer generated is strictly grounded in the text chunks retrieved from your sources. The citation badges link directly to the exact chunk used."
    },
    {
      question: "Is there a limit to how many sources I can add?",
      answer: "Currently, you can add up to 50 sources per notebook on the free tier. Each individual file must be under 50MB."
    }
  ]

  return (
    <section id="faq" className="border-t bg-muted/30 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know about using ChaibookLM.
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
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
