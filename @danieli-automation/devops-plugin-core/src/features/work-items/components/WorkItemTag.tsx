import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import * as React from "react";

type Props = {
    tag: string;
};

export function WorkItemTag({ tag }: Props) {
    return (
        <div className="tb-card-tag">
            <Pill size={PillSize.compact} variant={PillVariant.colored}>
                {tag}
            </Pill>
        </div>
    );
}
