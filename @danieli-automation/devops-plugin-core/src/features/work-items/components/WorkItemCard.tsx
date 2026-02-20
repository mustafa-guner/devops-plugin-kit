import "app/styles/work-item-card.scss";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { fetchPullRequestDetails } from "features/pull-requests/api/pullRequests";
import { getRelatedPullRequests } from "features/pull-requests/utils/pullRequest";
import { WorkItemAssignee } from "features/work-items/components/WorkItemAssignee";
import { WorkItemMenu } from "features/work-items/components/WorkItemMenu";
import { WorkItemRelatedPullRequests } from "features/work-items/components/WorkItemRelatedPullRequests";
import { WorkItemRemainingWork } from "features/work-items/components/WorkItemRemainingWork";
import { WorkItemState } from "features/work-items/components/WorkItemState";
import { WorkItemTags } from "features/work-items/components/WorkItemTags";
import { WorkItemTitle } from "features/work-items/components/WorkItemTitle";
import { WORK_ITEM_TYPE_ICON } from "features/work-items/constants/DefaultConsant";
import FieldConstant from "features/work-items/constants/FieldConstant";
import { useWorkItemStore } from "features/work-items/stores/useWorkItemStore";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { getTagsByWorkItem, isTask } from "features/work-items/utils/workItem";
import * as React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
    workItem: AdoWorkItemType;
    className?: string;
    isNewTask: boolean;
};

export const WorkItemCard = React.forwardRef<HTMLDivElement, Props>(
    ({ workItem, className, isNewTask, ...divProps }, ref) => {

        const { workItemErrors, setWorkItemError } = useWorkItemStore();
        const [localError, setLocalError] = React.useState<string | null>(null);
        const globalError = workItemErrors[workItem.id] ?? null;
        const cardError = localError ?? globalError;

        const [prs, setPrs] = React.useState<any[]>([]);
        const [isLoadingPrs, setIsLoadingPrs] = React.useState(false);

        const [isEditTitleEnabled, setIsEditTitleEnabled] = React.useState(false);

        const relatedPullRequests = React.useMemo(() => getRelatedPullRequests(workItem.relations), [workItem.relations]);

        React.useEffect(() => {
            let cancelled = false;
            if (!relatedPullRequests.length) {
                setPrs([]);
                return;
            }

            setIsLoadingPrs(true);
            //make sure all the related pull requests are fetched on load.
            Promise.all(relatedPullRequests.map((rel: any) => fetchPullRequestDetails(rel.url)))
                .then((list) => {
                    if (!cancelled) setPrs(list.filter(Boolean));
                })
                .catch((e) => {
                    if (!cancelled) setWorkItemError(workItem.id, String(e));
                })
                .finally(() => {
                    if (!cancelled) setIsLoadingPrs(false);
                });

            return () => {
                cancelled = true;
            };
        }, [relatedPullRequests]);


        const titleEditOptions = {
            setIsEditTitleEnabled: setIsEditTitleEnabled,
            isEditTitleEnabled: isEditTitleEnabled
        }

        const errorHandlers = {
            // Use local error for inline validation
            setCardError: (msg: string | null, opts?: { local?: boolean }) => {
                if (opts?.local ?? true) {
                    setLocalError(msg);
                } else {
                    setWorkItemError(workItem.id, msg);
                }
            },
            clearCardError: () => {
                setLocalError(null);
                setWorkItemError(workItem.id, null);
            },
        };

        const type = workItem.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE];
        const icon = WORK_ITEM_TYPE_ICON[type] || WORK_ITEM_TYPE_ICON["Default"];
        const tags = getTagsByWorkItem(workItem);

        return (
            <div style={{ height: "100%" }} ref={ref} className={[className, !isTask(workItem) && workItem.isFaded && "is-faded"].filter(Boolean).join(" ")}{...divProps}>
                {/*--Work Item Menu--*/}
                {!isNewTask && <WorkItemMenu errorHandlers={errorHandlers} workItem={workItem} titleEditOptions={titleEditOptions} />}

                <div
                    className="tb-card-in"
                    style={{ borderLeft: `4px solid ${icon.color}` }}>

                    {/*--Title--*/}
                    <WorkItemTitle
                        workItem={workItem}
                        isNewTask={isNewTask}
                        icon={icon}
                        isEditEnabled={isEditTitleEnabled}
                        errorHandlers={errorHandlers}
                        setIsEditEnabled={setIsEditTitleEnabled} />

                    {/*--State--*/}
                    <WorkItemState workItem={workItem} errorHandlers={errorHandlers} />

                    <div className="flex-row justify-space-between align-items-center align-center" style={{ marginBottom: 5 }}>
                        {/*--Assignee--*/}
                        <WorkItemAssignee workItem={workItem} errorHandlers={errorHandlers} />

                        {/*Remaining Work*/}
                        <WorkItemRemainingWork workItem={workItem} />
                    </div>

                    {/*--Tags--*/}
                    <WorkItemTags tags={tags} />

                    {/*Related Pull Requests*/}
                    <WorkItemRelatedPullRequests parent={workItem} pullRequests={prs} isLoadingPrs={isLoadingPrs} />
                </div>
                {
                    cardError &&
                    <Tooltip delayMs={500} overflowOnly={false} text={cardError}>
                        <div className="tb-card-error">Error</div>
                    </Tooltip>
                }
            </div >

        );
    }
);