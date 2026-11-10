// Redirects straight into the queue, so there is no shell to render for it;
// opt the segment out of instant-navigation validation like its siblings.
export const instant = false;

import { redirect } from "next/navigation";

const DashboardIndex = () => redirect("/queue");

export default DashboardIndex;
