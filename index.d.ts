import * as React from "react";
export declare function DevtoolsCard(props?: Record<string, unknown>): React.ReactElement;
export declare const DevTools: typeof DevtoolsCard;
export declare namespace Route {
  function GET(req: Request, ctx?: { params?: { slug?: string[] } }): Promise<Response>;
  function POST(req: Request, ctx?: { params?: { slug?: string[] } }): Promise<Response>;
}
