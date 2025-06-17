import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
			<div className="max-w-md space-y-6">
				<h1 className="text-6xl font-bold">404</h1>
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold tracking-tight">
						Page not found
					</h2>
					<p className="text-muted-foreground">
						If you&apos;re seeing this, it&apos;s either there&apos;s something
						wrong with us or there&apos;s something wrong with you.
					</p>
					<p className="text-muted-foreground font-medium">
						And we&apos;d make a pretty strong bet that it&apos;s you.
					</p>
				</div>
				<div className="pt-4">
					<Button variant="default" className="gap-2" onClick={() => window.location.href = "/"}>
						<ArrowLeft className="h-4 w-4" />
						Back to home
					</Button>
				</div>
			</div>
		</div>
	);
}
