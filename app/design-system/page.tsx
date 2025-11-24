"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { LayoutDashboard, Users, Settings, Bell } from "lucide-react";

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-h1 mb-2">Design System</h1>
          <p className="text-body-l text-text-secondary">
            Complete component library for DoppleCart
          </p>
        </div>

        {/* Typography */}
        <section>
          <h2 className="text-h2 mb-6">Typography</h2>
          <Card variant="outlined" padding="lg">
            <div className="space-y-4">
              <div>
                <h1 className="text-h1">Heading 1 - 42px</h1>
                <p className="text-body-s text-text-tertiary mt-1">
                  Used for page titles
                </p>
              </div>
              <div>
                <h2 className="text-h2">Heading 2 - 32px</h2>
                <p className="text-body-s text-text-tertiary mt-1">
                  Used for section titles
                </p>
              </div>
              <div>
                <h3 className="text-h3">Heading 3 - 24px</h3>
                <p className="text-body-s text-text-tertiary mt-1">
                  Used for subsection titles
                </p>
              </div>
              <div>
                <h4 className="text-h4">Heading 4 - 20px</h4>
                <p className="text-body-s text-text-tertiary mt-1">
                  Used for card titles
                </p>
              </div>
              <div>
                <h5 className="text-h5">Heading 5 - 18px</h5>
                <p className="text-body-s text-text-tertiary mt-1">
                  Used for small headings
                </p>
              </div>
              <div>
                <p className="text-body-l">
                  Body Large - 16px: This is the default body text size used
                  throughout the application.
                </p>
              </div>
              <div>
                <p className="text-body-m">
                  Body Medium - 14px: Used for secondary text and descriptions.
                </p>
              </div>
              <div>
                <p className="text-body-s">
                  Body Small - 12px: Used for helper text, captions, and labels.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-h2 mb-6">Buttons</h2>
          <Card variant="outlined" padding="lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-h4 mb-4">Variants</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="filled">Filled</Button>
                  <Button variant="tonal">Tonal</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="text">Text</Button>
                </div>
              </div>
              <div>
                <h3 className="text-h4 mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <div>
                <h3 className="text-h4 mb-4">States</h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button disabled>Disabled</Button>
                  <Button fullWidth className="max-w-xs">
                    Full Width
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-h2 mb-6">Inputs</h2>
          <Card variant="outlined" padding="lg">
            <div className="space-y-6 max-w-md">
              <Input
                label="Default Input"
                placeholder="Enter text..."
                variant="border"
              />
              <Input
                label="Filled Input"
                placeholder="Enter text..."
                variant="filled"
              />
              <Input
                label="Input with Helper Text"
                placeholder="Enter text..."
                helperText="This is helpful information"
              />
              <Input
                label="Input with Error"
                placeholder="Enter text..."
                error
                errorMessage="This field is required"
              />
              <Input
                label="Disabled Input"
                placeholder="Enter text..."
                disabled
              />
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-h2 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="elevated" padding="md">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>
                  Cards with shadow elevation for emphasis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-m text-text-secondary">
                  This card uses the elevated variant with shadow.
                </p>
              </CardContent>
            </Card>

            <Card variant="outlined" padding="md">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>
                  Cards with border for subtle separation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-m text-text-secondary">
                  This card uses the outlined variant with border.
                </p>
              </CardContent>
            </Card>

            <Card variant="filled" padding="md">
              <CardHeader>
                <CardTitle>Filled Card</CardTitle>
                <CardDescription>
                  Cards with background fill for grouping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-m text-text-secondary">
                  This card uses the filled variant with background.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-h2 mb-6">Badges</h2>
          <Card variant="outlined" padding="lg">
            <div className="space-y-4">
              <div>
                <h3 className="text-h4 mb-4">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                </div>
              </div>
              <div>
                <h3 className="text-h4 mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Modal */}
        <section>
          <h2 className="text-h2 mb-6">Modal</h2>
          <Card variant="outlined" padding="lg">
            <div className="space-y-4">
              <p className="text-body-m text-text-secondary">
                Click the button below to open a modal dialog.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>
            </div>
          </Card>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
            description="This is an example modal dialog demonstrating the modal component."
            size="md"
          >
            <div className="space-y-4">
              <p className="text-body-m text-text-secondary">
                Modal content goes here. You can include any content you need
                within the modal body.
              </p>
              <Input
                label="Example Input"
                placeholder="Type something..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <ModalFooter>
              <Button variant="text" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
            </ModalFooter>
          </Modal>
        </section>

        {/* Sidebar Example */}
        <section>
          <h2 className="text-h2 mb-6">Sidebar Navigation</h2>
          <Card variant="outlined" padding="none">
            <div className="h-96 overflow-hidden">
              <div className="flex h-full">
                <aside className="w-64 border-r border-border bg-surface-container">
                  <div className="flex h-16 items-center border-b border-border px-6">
                    <span className="text-h4 font-bold">DoppleCart</span>
                  </div>
                  <nav className="p-4">
                    <ul className="space-y-1">
                      <li>
                        <a
                          href="#"
                          className="flex items-center gap-3 rounded-md bg-primary/10 px-3 py-2 text-body-m font-medium text-primary"
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          <span>Dashboard</span>
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-body-m font-medium text-text-secondary hover:bg-surface-container-high hover:text-text-primary"
                        >
                          <Users className="h-5 w-5" />
                          <span>Personas</span>
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-body-m font-medium text-text-secondary hover:bg-surface-container-high hover:text-text-primary"
                        >
                          <Bell className="h-5 w-5" />
                          <span>Notifications</span>
                          <Badge size="sm" variant="danger" className="ml-auto">
                            3
                          </Badge>
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-body-m font-medium text-text-secondary hover:bg-surface-container-high hover:text-text-primary"
                        >
                          <Settings className="h-5 w-5" />
                          <span>Settings</span>
                        </a>
                      </li>
                    </ul>
                  </nav>
                </aside>
                <div className="flex-1 p-6">
                  <p className="text-body-m text-text-secondary">
                    Main content area would go here
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Colors */}
        <section>
          <h2 className="text-h2 mb-6">Colors</h2>
          <Card variant="outlined" padding="lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-h4 mb-4">Primary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="h-24 bg-primary rounded-md mb-2"></div>
                    <p className="text-body-s font-medium">Primary</p>
                    <p className="text-body-s text-text-tertiary">#2B4C7E</p>
                  </div>
                  <div>
                    <div className="h-24 bg-secondary rounded-md mb-2"></div>
                    <p className="text-body-s font-medium">Secondary</p>
                    <p className="text-body-s text-text-tertiary">#E94F37</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-h4 mb-4">Semantic Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="h-24 bg-success rounded-md mb-2"></div>
                    <p className="text-body-s font-medium">Success</p>
                    <p className="text-body-s text-text-tertiary">#4CAF50</p>
                  </div>
                  <div>
                    <div className="h-24 bg-warning rounded-md mb-2"></div>
                    <p className="text-body-s font-medium">Warning</p>
                    <p className="text-body-s text-text-tertiary">#FFC107</p>
                  </div>
                  <div>
                    <div className="h-24 bg-danger rounded-md mb-2"></div>
                    <p className="text-body-s font-medium">Danger</p>
                    <p className="text-body-s text-text-tertiary">#D32F2F</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-h4 mb-4">Gray Scale</h3>
                <div className="grid grid-cols-5 gap-4">
                  {[900, 700, 500, 300, 100].map((shade) => (
                    <div key={shade}>
                      <div
                        className={`h-24 bg-gray-${shade} rounded-md mb-2`}
                      ></div>
                      <p className="text-body-s font-medium">Gray {shade}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}






