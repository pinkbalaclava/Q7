Design Brief: Q7 CRM Dashboard V2 Enhancements
Project Goal & Scope
The primary goal of this project was to significantly enhance the Q7 CRM Dashboard V2 by improving the representation and management of multi-service clients. This involved refactoring the Kanban board to display each service instance as a distinct card and redesigning the client-specific view to offer a service-centric, detailed management interface. The aim was to provide accountants with clearer real-time visibility and more granular control over individual client tasks.

Must-Have Features
Kanban Board Multi-Service Mapping:
Each service instance for a client must appear as a separate card on the Kanban board.
Each service card must maintain its own independent deadline, assignee, status, amount, documents, communications, and flags.
Column counts on the Kanban board must accurately reflect the number of periods in each lane.
Existing global filters (service, status, assignee, search) and search functionality must continue to work correctly with the new multi-card representation.
Redesigned Client View:
Layout: A dedicated client view accessible by clicking a client's name. It features a header with client name and a quick summary (total active services, next due). A left pane lists all of the client's services/periods. A main pane displays service-specific details via a tabbed interface.
Service-Scoped Tabs: The main pane includes "Overview," "Comms," "Documents," "History," and "Notes" tabs, with all data within these tabs strictly bound to the currently selected service.
Data Binding & Editing: Due Date, Amount, and Notes fields within the "Overview" tab must be editable locally. All data (Due Date, Amount, Notes, Comms, Documents, History) must dynamically update when a different service is selected in the left pane, ensuring no data bleed between services.
Navigation: A "Back to Board" breadcrumb/button for easy return to the main dashboard.
Client View Filters & Sort:
Filter Control: A compact filter control in the left panel header allowing multi-selection filtering by "Service Type" (VAT, Accounts, Self-Assessment) and "Stage/Status" (To Do, In Progress, With Client, Ready for Review, Completed).
Search Input: An optional quick search input ("Search period or client...") to filter the list by client name and period label.
Sort Control: Two-state toggle buttons for sorting by "Due Date" (Ascending/Descending), with Ascending as the default.
List Behavior: The services list must update immediately based on active filters and sort order, maintaining the current selection or clearing it if the item is filtered out.
Auto-Filter Client View from Kanban:
When navigating from a Kanban card to the Client view, the clientId, serviceType, and optionally the periodId of the clicked card must be passed as context.
The Client view must automatically initialize its "Service Type" filter to the passed service.
If a periodId is provided, that specific service period must be pre-selected in the list, and its details loaded in the main pane.
A clear UI hint (e.g., "Filtered by: VAT") with a "Clear" button must be displayed when an auto-filter is active.
Nice-to-Haves
Pre-selecting the exact period in the Client view when its periodId is passed during navigation from the Kanban.
Non-Goals / Exclusions
No backend implementation; all data and state management are handled locally on the frontend.
No grouping by "Overdue/Due Soon/etc." in the Client view filters; only direct filtering and sorting.
No sharing of fields or data between different service instances for the same client on the Kanban board.
The auto-filter functionality in the Client view does not affect or change the global state of the main dashboard/Kanban board.
Tech Stack & Key Dependencies
Framework: Vite + React 18 + TypeScript
Routing: React Router DOM
Styling: Tailwind CSS, Radix UI primitives (with shadcn/ui wrappers), class-variance-authority, clsx, tailwind-merge
Charts: Chart.js, react-chartjs-2, Recharts
Calendar: react-big-calendar, date-fns
Icons: lucide-react
UI/UX Guidelines (Concise)
Maintain the existing modern, clean, and professional aesthetic.
Ensure consistency in UI components: card styles, badges, pills, chips, subtle borders, and rounded corners.
Prioritize user experience through clear spacing, visual hierarchy, and intuitive interactions.
Ensure full accessibility, including keyboard navigation, proper focus states, and ARIA attributes for screen readers.
Maintain responsive design across various devices.
Data Model (Tables/Entities + 1–2 lines each)
Period: Represents a single, distinct service engagement for a client (e.g., a VAT return for a specific quarter). It encapsulates all details pertinent to that service, including its status, due date, assignee, financial amount, associated documents, communications, and historical changes.
Client: Defines a client entity, holding core information such as name, contact details, company registration numbers, active services, and risk assessment.
PeriodDoc: Describes a document linked to a specific Period, detailing its ID, name, URL, type (Working/Output), upload timestamp, and the user who uploaded it.
PeriodComms: Records individual communication events related to a Period, specifying the timestamp, type (email/note), and a summary of the interaction.
Approval: Stores metadata for client approval requests related to a Period, including a unique link for approval and the timestamp of the request.
Workflow States / Statuses
Service Types: VAT, ACCOUNTS, SA (Self-Assessment).
Kanban Lanes (High-level stages): To Do, In Progress, With Client, Ready for Review, Completed.
Detailed Statuses (Service-specific progressions):
VAT: Awaiting Docs → In Progress → Awaiting Approval → Ready to Submit → Submitted → Paid → Closed.
ACCOUNTS: Awaiting Docs → In Progress → Draft Sent → Awaiting Approval → Ready to File → Filed → Closed.
SA: Awaiting Questionnaire → Reminders Sent → In Progress → Awaiting Approval → Submitted → Done.
Transitions: Explicitly defined forward and backward transitions between detailed statuses for each service type.
Special States: TERMINAL statuses (e.g., Submitted, Filed, Paid, Done, Closed) and AWAITING_DOCS statuses (e.g., Awaiting Docs, Awaiting Questionnaire, Reminders Sent).
Open Questions
All explicit requirements and reported errors throughout the project have been addressed within the defined scope. No open questions remain regarding the implemented features.