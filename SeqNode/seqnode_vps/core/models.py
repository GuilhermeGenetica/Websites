import os
import time
import uuid
from typing import Dict, List, Any, Optional, Union
from enum import Enum
from pydantic import BaseModel, Field


class NodeStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    CANCELLED = "CANCELLED"


class ParameterSchema(BaseModel):
    type: str = "string"
    default: Optional[Any] = None
    label: str = ""
    description: str = ""
    min: Optional[Union[int, float]] = None
    max: Optional[Union[int, float]] = None
    choices: Optional[List[str]] = None
    required: bool = False
    category: str = "General"
    extension: Optional[List[str]] = None
    visible: bool = True
    advanced: bool = False


class IOPortSchema(BaseModel):
    type: str = "file"
    extensions: List[str] = Field(default_factory=list)
    label: str = ""
    description: str = ""
    required: bool = True
    multiple: bool = False
    from_template: Optional[str] = None


class ValidationRule(BaseModel):
    type: str
    target: Optional[str] = None
    cmd: Optional[str] = None
    expect_contains: Optional[str] = None
    expect_returncode: Optional[int] = 0
    message: Optional[str] = None


class ResourceRequirements(BaseModel):
    min_memory_gb: Optional[float] = None
    recommended_memory_gb: Optional[float] = None
    min_disk_gb: Optional[float] = None
    min_cpu_cores: Optional[int] = None
    gpu_required: bool = False


class ReferenceSpec(BaseModel):
    id: str
    type: str = "file"
    extensions: List[str] = Field(default_factory=list)
    label: str = ""
    description: str = ""
    builds: List[str] = Field(default_factory=list)
    url: Optional[str] = None
    auto_download: bool = False


class RuntimeConfig(BaseModel):
    type: str = "system"
    image: Optional[str] = None
    conda_env: Optional[str] = None
    conda_packages: List[str] = Field(default_factory=list)
    conda_channels: List[str] = Field(default_factory=lambda: ["conda-forge", "bioconda", "defaults"])
    pip_packages: List[str] = Field(default_factory=list)
    env_vars: Dict[str, str] = Field(default_factory=dict)
    shell: str = "/bin/bash"
    working_dir: Optional[str] = None


class CommandSpec(BaseModel):
    template: str
    shell: str = "/bin/bash"
    working_dir: Optional[str] = None
    pre_commands: List[str] = Field(default_factory=list)
    post_commands: List[str] = Field(default_factory=list)


class InstallConfig(BaseModel):
    method: str = "conda"
    conda_env: Optional[str] = None
    conda_package: Optional[str] = None
    pip_package: Optional[str] = None
    conda_channels: List[str] = Field(default_factory=lambda: ["bioconda", "conda-forge", "defaults"])
    binary: Optional[str] = None
    version_check: Optional[str] = None
    size_estimate: Optional[str] = None
    docs_url: Optional[str] = None
    notes: Optional[str] = None
    default_paths: Dict[str, str] = Field(default_factory=dict)
    refs_required: List[Dict[str, Any]] = Field(default_factory=list)
    env_vars: Dict[str, str] = Field(default_factory=dict)
    post_install: Optional[str] = None


class PluginManifest(BaseModel):
    name: str
    id: str
    version: str = "1.0.0"
    category: str = "General"
    description: str = ""
    author: str = ""
    license: str = "MIT"
    tags: List[str] = Field(default_factory=list)
    command: Union[str, CommandSpec] = ""
    runtime: RuntimeConfig = Field(default_factory=RuntimeConfig)
    params: Dict[str, ParameterSchema] = Field(default_factory=dict)
    inputs: Dict[str, IOPortSchema] = Field(default_factory=dict)
    outputs: Dict[str, IOPortSchema] = Field(default_factory=dict)
    references: List[ReferenceSpec] = Field(default_factory=list)
    resources: ResourceRequirements = Field(default_factory=ResourceRequirements)
    validation: Dict[str, List[ValidationRule]] = Field(default_factory=dict)
    ui: Dict[str, Any] = Field(default_factory=dict)
    container: Optional[str] = None
    install: Optional[InstallConfig] = None


class WorkflowNodeDef(BaseModel):
    id: str = Field(default_factory=lambda: f"node_{uuid.uuid4().hex[:8]}")
    tool_id: str
    label: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=dict)
    inputs_map: Dict[str, str] = Field(default_factory=dict)
    outputs_map: Dict[str, str] = Field(default_factory=dict)
    edges: List[str] = Field(default_factory=list)
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})
    enabled: bool = True
    notes: str = ""
    custom_command: str = ""
    plugin_paths: Dict[str, str] = Field(default_factory=dict)
    # Runtime override: controls how the command is wrapped for execution
    # mode: auto | system | conda | mamba | shell_source | direct
    runtime_override: Dict[str, Any] = Field(default_factory=dict)


class WorkflowDefinition(BaseModel):
    id: str = Field(default_factory=lambda: f"wf_{uuid.uuid4().hex[:8]}")
    name: str = "Untitled Workflow"
    description: str = ""
    version: str = "1.0.0"
    author: str = ""
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    nodes: List[WorkflowNodeDef] = Field(default_factory=list)
    global_params: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)


class ExecutionLog(BaseModel):
    timestamp: float = Field(default_factory=time.time)
    node_id: str = ""
    level: str = "INFO"
    message: str = ""
    source: str = "engine"


class WorkflowState(BaseModel):
    workflow_id: str
    run_id: str = Field(default_factory=lambda: f"run_{uuid.uuid4().hex[:8]}")
    status: str = "PENDING"
    node_statuses: Dict[str, NodeStatus] = Field(default_factory=dict)
    node_outputs: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    logs: List[ExecutionLog] = Field(default_factory=list)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    error_message: Optional[str] = None