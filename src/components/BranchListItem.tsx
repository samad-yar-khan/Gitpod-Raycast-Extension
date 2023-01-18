import { Action, ActionPanel, Color, List, open } from "@raycast/api";

// import { MutatePromise } from "@raycast/utils";
// import { format } from "date-fns";
// import { useMemo } from "react";
import { branchStatus, GitpodIcons, UIColors } from "../../constants";
import { BranchDetailsFragment, MyPullRequestsQuery, PullRequestFieldsFragment, UserFieldsFragment } from "../generated/graphql";

type BranchItemProps = {
  branch: BranchDetailsFragment;
  mainBranch: string;
  viewer?: UserFieldsFragment;
  repository: string
};

export default function BranchListItem({ branch, mainBranch, repository , viewer }: BranchItemProps) {
  const accessories: List.Item.Accessory[] = [];
  const branchURL = "https://github.com/"+repository+"/tree/"+branch.branchName

  if (branch.compData){
    if (branch.compData.status){
      switch( branch.compData.status.toString()){
        case branchStatus.ahead:
          accessories.unshift({
            text: branch.compData.aheadBy.toString(),
            icon: GitpodIcons.branchAhead
          });
          break;
        case branchStatus.behind: 
          accessories.unshift({
            text: branch.compData.aheadBy.toString(),
            icon: GitpodIcons.branchBehind
          });
          break;
        case branchStatus.diverged:
          accessories.unshift({
            text: branch.compData.aheadBy.toString(),
            icon: GitpodIcons.branchDiverged
          })
          break;
        case branchStatus.IDENTICAL: 
          accessories.unshift({
            text: "IDN",
            icon: GitpodIcons.branchIdentical
          })
          break;
      }
    }

    if (branch.compData.commits){
      accessories.unshift({
        tag : {
          value : branch.compData.commits.totalCount.toString(),
          color : Color.Yellow
        },
        icon: GitpodIcons.commit_icon
        
      })
    }
  }

  return (
    <List.Item
      icon={ GitpodIcons.branchIcon }
      subtitle={mainBranch}
      title={branch.branchName}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action
            title="Open PR in Gitpod"
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
            onAction={() => {
              open(`https://gitpod.io/#${branchURL}`);
            }}
          />
          <Action
            title="Open PR in github"
            onAction={() => {
              open(branchURL);
            }}
            shortcut={{ modifiers: ["shift"], key: "enter" }}
          />
        </ActionPanel>
      }
    />
  )

}
