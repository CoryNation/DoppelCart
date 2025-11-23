import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-h2 mb-6">Dashboard</h1>
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Welcome to your dashboard</CardTitle>
          <CardDescription>
            Overview of your AI influencer management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-m text-text-secondary mb-4">
            Dashboard content will be implemented here.
          </p>
          <p className="text-body-s text-text-tertiary mb-2">
            This page will display:
          </p>
          <ul className="list-disc list-inside space-y-1 text-body-s text-text-tertiary ml-4">
            <li>Overview of all personas</li>
            <li>Upcoming scheduled posts</li>
            <li>Recent analytics</li>
            <li>Quick actions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

