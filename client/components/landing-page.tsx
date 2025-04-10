import { ExternalLink, FileEdit, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Link } from "react-router"


const LandingPage = () => {
    return (
        <section className="relative overflow-hidden py-32 bg-zinc-50/50 dark:bg-background">
            <div className="absolute inset-x-0 top-0 flex h-full w-full items-center justify-center opacity-100">
                <img
                    alt="background pattern"
                    src="https://shadcnblocks.com/images/block/patterns/square-alt-grid.svg"
                    className="opacity-90 text-zinc-200 fill-zinc-200 stroke-zinc-300 dark:opacity-20 [mask-image:radial-gradient(75%_75%_at_center,white,transparent)]"
                />
            </div>
            <div className="relative z-10 container">
                <div className="mx-auto flex max-w-5xl flex-col items-center">
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="rounded-xl bg-background/30 p-4 shadow-sm backdrop-blur-sm dark:bg-foreground/5">
                            <div className="flex items-center justify-center gap-2">
                                <FileEdit className="h-10 w-10 text-primary" />
                                <Briefcase className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <div>
                            <h1 className="mb-6 text-2xl font-bold tracking-tight text-pretty lg:text-5xl">
                                Land your dream job with <span className="text-primary">EasyApply</span>
                            </h1>
                            <p className="mx-auto max-w-3xl text-muted-foreground lg:text-xl">
                                Tailor your resume in seconds, not hours. Our AI-powered platform matches your skills to job
                                descriptions, helping you stand out from the crowd and apply with confidence.
                            </p>
                        </div>
                        <div className="mt-6 flex justify-center gap-3">
                            <Link to="/signup">
                                <Button className="shadow-sm transition-shadow hover:shadow">Try it, it's Free</Button>
                            </Link>
                            <Link to="/signup">
                                <Button variant="outline" className="group">
                                    Sign Up <ExternalLink className="ml-2 h-4 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                            </Link>
                        </div>
                        <div className="mt-20 flex flex-col items-center gap-5">
                            <p className="font-medium text-muted-foreground lg:text-left">Trusted by job seekers worldwide</p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <div
                                    className={cn(buttonVariants({ variant: "outline" }), "group flex items-center justify-center p-2")}
                                >
                                    <span className="text-sm font-medium">93% interview rate</span>
                                </div>
                                <div
                                    className={cn(buttonVariants({ variant: "outline" }), "group flex items-center justify-center p-2")}
                                >
                                    <span className="text-sm font-medium">2x faster applications</span>
                                </div>
                                <div
                                    className={cn(buttonVariants({ variant: "outline" }), "group flex items-center justify-center p-2")}
                                >
                                    <span className="text-sm font-medium">AI-powered matching</span>
                                </div>
                                <div
                                    className={cn(buttonVariants({ variant: "outline" }), "group flex items-center justify-center p-2")}
                                >
                                    <span className="text-sm font-medium">ATS-friendly templates</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export { LandingPage }