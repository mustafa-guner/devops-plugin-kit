import * as React from "react";
import { WorkItemTag } from "./WorkItemTag";

export function WorkItemTags({ tags }: { tags: string[] }) {
    return (
        <>
            {tags.length > 0 && (
                <div className="tb-card-tags">
                    {tags.map((tag: string, index: number) => {
                        return <WorkItemTag key={index + "-id"} tag={tag} />;
                    })}
                </div>
            )}
        </>
    )
}