import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import Link from "next/link";

export default function PersonasPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h2">Personas</h1>
        <Button asChild>
          <Link href="/personas/new">Create Persona</Link>
        </Button>
      </div>
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Manage Your Personas</CardTitle>
          <CardDescription>
            Create and manage AI influencer personas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-m text-text-secondary mb-4">
            Personas management will be implemented here.
          </p>
          <p className="text-body-s text-text-tertiary mb-2">
            This page will display:
          </p>
          <ul className="list-disc list-inside space-y-1 text-body-s text-text-tertiary ml-4">
            <li>List of all user personas</li>
            <li>Create new persona form</li>
            <li>Edit persona details</li>
            <li>Delete persona actions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

