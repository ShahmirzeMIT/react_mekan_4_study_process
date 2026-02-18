import {RootState, useAppSelector} from "@/store";
import {callApi} from "@/utils/callApi.ts";

export default function useUICanvasLoadIssueInfo() {
    const currentProject = useAppSelector((state: RootState) => state.project)
    const loadIssueInfo = async (selectedUI) => {
        return callApi("/ui-canvas/get-backlog-issue-stats", {
            input: selectedUI.input ?? {},
            projectId: currentProject.currentProject.id,
        })
    }
    return {loadIssueInfo}
}