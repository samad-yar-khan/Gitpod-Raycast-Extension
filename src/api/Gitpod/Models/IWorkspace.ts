import fetch from 'node-fetch';

import { GitpodAPI, StartWorkspace, StopWorkspace } from "../api";

import { GitpodDataModel } from "./Model";

type IWorkspaceParams = {
  workspaceID: string;
};

const workspaceURLs = {
  getWorkspace: "https://api.gitpod.io/gitpod.experimental.v1.WorkspacesService/GetWorkspace",
  getAllWorkspaces: "https://api.gitpod.io/gitpod.experimental.v1.WorkspacesService/ListWorkspaces",
  deleteWorkspace: "https://api.gitpod.io/gitpod.experimental.v1.WorkspacesService/DeleteWorkspace",
};

export class IWorkspace implements GitpodDataModel {
  private token = "";
  private initialized = false;
  private workspaceId: string;
  private ownerId: string;
  private projectId: string;
  private context: {
    contextURL: string;
    git: {
      normalizedContextUrl: string;
    };
  };
  private description: string;
  public instanceId: string;
  public createdAt: string
  private status: {
    phase: string;
  };

  setStatus(status : { phase: string }): IWorkspace {
    this.status = status;
    return this;
  }

  getWorkspaceId(): string {
    if (!this.initialized) {
      throw new Error("IWorkspace instance not initialized");
    }
    return this.workspaceId;
  }

  getOwnerId(): string {
    if (!this.initialized) {
      throw new Error("IWorkspace instance not initialized");
    }
    return this.ownerId;
  }

  getProjectId(): string {
    if (!this.initialized) {
      throw new Error("IWorkspace instance not initialized");
    }
    return this.projectId;
  }

  getContext(): { contextURL: string; git: { normalizedContextUrl: string } } {
    if (!this.initialized) {
      throw new Error("IWorkspace instance not initialized");
    }
    return this.context;
  }

  getDescription(): string {
    if (!this.initialized) {
      throw new Error("IWorkspace instance not initialized");
    }
    return this.description;
  }

  getStatus(): { phase: string } {
    if (!this.initialized) {
      throw new Error("IWorkspace instance not initialized");
    }
    return this.status;
  }

  constructor(workspace: any, token: string) {
    this.workspaceId = workspace.workspaceId;
    this.ownerId = workspace.ownerId;
    this.projectId = workspace.projectId;
    this.context = workspace.context;
    this.status = workspace.status.instance.status;
    this.description = workspace.description;
    this.token = token;
    this.instanceId = workspace.status.instance.instanceId
    this.initialized = true;
    this.createdAt = workspace.status.instance.createdAt
  }

  parse(json: string): IWorkspace {
    const data = JSON.parse(json);
    this.workspaceId = data.result.workspaceId;
    this.ownerId = data.result.ownerId;
    this.projectId = data.result.context.git.normalizedContextUrl.split("/").slice(-2)[0];
    this.context = {
      contextURL: data.result.context.contextUrl,
      git: {
        normalizedContextUrl: data.result.context.git.normalizedContextUrl,
      },
    };

    this.instanceId = data.result.status.instance.instanceId
    this.description = data.result.description;
    this.status = {
      phase: data.result.status.instance.status.phase,
    };

    this.createdAt = data.result.status.instance.createdAt

    return this;
  }

  dispose(): void {
    // Clear all properties
    this.workspaceId = "";
    this.ownerId = "";
    this.projectId = "";
    this.context = { contextURL: "", git: { normalizedContextUrl: "" } };
    this.description = "";
    this.status = { phase: "" };
  }

  public start (api: GitpodAPI) {
    const workspaceParam: StartWorkspace = {
        method: "startWorkspace",
        params: this.workspaceId
    }

    api.execute(workspaceParam)
  }

  public fetch: (params: IWorkspaceParams) => Promise<IWorkspace> = async (
    params: IWorkspaceParams
  ): Promise<IWorkspace> => {
    const { workspaceID } = params;

    const response = await fetch(workspaceURLs.getWorkspace, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        // Authorization: `Bearer ${this.token}`,
        "cookie" : `_gitpod_io_v2_=${this.token}`,
      },
      body: JSON.stringify({ workspaceID }),
    });
    const json = await response.json();

    const workspace = this.parse(JSON.stringify(json));
    return workspace;
  };

  public static fetchAll = async (token: string): Promise<Map<string, IWorkspace>> => {
    const response = await fetch(workspaceURLs.getAllWorkspaces, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Authorization: `Bearer ${token}`,
        "cookie" : `_gitpod_io_v2_=${token}`
      },
      body: JSON.stringify({}),
    })

    const json = await response.json() as any ;
    const workspaceMap = new Map<string, IWorkspace>();

    json.result.map((workspace: any) => {
        const space =  new IWorkspace(workspace, token);
        workspaceMap.set(space.workspaceId, space);
    })

    return workspaceMap
  }

  public delete = async () => {
    const response = await fetch(workspaceURLs.deleteWorkspace, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${this.token}`,
        "cookie" : `_gitpod_io_v2_=${this.token}`
      },
      body: JSON.stringify({ workspaceId: this.workspaceId }),
    });
    const result = await response.json();
    if (response.status !== 200) {
    //   throw new Error(`Failed to delete workspace: ${result.message}`);
    }

    this.dispose();
  };

  async stop(api: GitpodAPI): Promise<void> {
    const workspaceParam: StopWorkspace = {
        
      method: "stopWorkspace",
      params: this.workspaceId
  }

    api.execute(workspaceParam)
  }
}
