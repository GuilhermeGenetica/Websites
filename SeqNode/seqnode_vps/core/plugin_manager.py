import os
import yaml
import logging
import hashlib
from typing import Dict, List, Optional, Any
from pydantic import ValidationError
from core.models import PluginManifest

logger = logging.getLogger("seqnode.plugins")


class PluginManager:

    def __init__(self, plugins_dir: str):
        self.plugins_dir = os.path.abspath(plugins_dir)
        self.tools: Dict[str, PluginManifest] = {}
        self._file_hashes: Dict[str, str] = {}
        self._categories: Dict[str, List[str]] = {}
        self._plugin_paths: Dict[str, str] = {}
        self.load_plugins()

    def _hash_file(self, path: str) -> str:
        h = hashlib.md5()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()

    def load_plugins(self):
        self.tools.clear()
        self._file_hashes.clear()
        self._categories.clear()
        self._plugin_paths.clear()

        if not os.path.exists(self.plugins_dir):
            os.makedirs(self.plugins_dir, exist_ok=True)
            logger.warning(f"Created empty plugins directory: {self.plugins_dir}")
            return

        for root, _, files in os.walk(self.plugins_dir):
            for file in files:
                if not file.endswith((".yaml", ".yml")):
                    continue
                path = os.path.join(root, file)
                self._load_single_plugin(path)

        logger.info(f"Loaded {len(self.tools)} plugin(s) from {self.plugins_dir}")
        for cat, ids in sorted(self._categories.items()):
            logger.info(f"  Category '{cat}': {', '.join(ids)}")

    def _load_single_plugin(self, path: str) -> Optional[PluginManifest]:
        try:
            with open(path, "r", encoding="utf-8") as f:
                docs = [d for d in yaml.safe_load_all(f) if isinstance(d, dict)]
                if not docs:
                    logger.warning(f"No valid YAML document found in: {path}")
                    return None
                raw = docs[0]
                
            if not isinstance(raw, dict):
                logger.warning(f"Skipping non-dict YAML: {path}")
                return None

            if "command" in raw and isinstance(raw["command"], str):
                pass
            elif "command" in raw and isinstance(raw["command"], dict):
                pass

            plugin = PluginManifest(**raw)
            self.tools[plugin.id] = plugin
            self._file_hashes[path] = self._hash_file(path)
            self._categories.setdefault(plugin.category, []).append(plugin.id)
            self._plugin_paths[plugin.id] = path
            logger.info(f"Registered plugin: {plugin.name} [{plugin.id}] v{plugin.version}")
            return plugin
        except ValidationError as ve:
            logger.error(f"Validation error in {path}: {ve}")
        except Exception as e:
            logger.error(f"Failed to load {path}: {e}")
        return None

    def reload_plugins(self) -> Dict[str, str]:
        changes = {"added": [], "updated": [], "removed": []}
        old_ids = set(self.tools.keys())
        self.load_plugins()
        new_ids = set(self.tools.keys())
        changes["added"] = list(new_ids - old_ids)
        changes["removed"] = list(old_ids - new_ids)
        return changes

    def get_tool(self, tool_id: str) -> Optional[PluginManifest]:
        return self.tools.get(tool_id)

    def list_tools(self, category: Optional[str] = None) -> List[PluginManifest]:
        if category:
            ids = self._categories.get(category, [])
            return [self.tools[tid] for tid in ids if tid in self.tools]
        return list(self.tools.values())

    def list_categories(self) -> List[str]:
        return sorted(self._categories.keys())

    def search_tools(self, query: str) -> List[PluginManifest]:
        q = query.lower()
        results = []
        for plugin in self.tools.values():
            searchable = f"{plugin.name} {plugin.description} {plugin.category} {' '.join(plugin.tags)}".lower()
            if q in searchable:
                results.append(plugin)
        return results

    def validate_tool_availability(self, tool_id: str) -> Dict[str, Any]:
        plugin = self.get_tool(tool_id)
        if not plugin:
            return {"available": False, "error": f"Plugin {tool_id} not found"}
        return {"available": True, "plugin": plugin.name, "version": plugin.version}

    def get_plugin_raw(self, tool_id: str) -> Optional[Dict[str, str]]:
        if tool_id not in self._plugin_paths:
            return None
        path = self._plugin_paths[tool_id]
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content, "filename": os.path.basename(path)}

    def save_plugin_raw(self, tool_id: Optional[str], filename: str, content: str) -> bool:
        if tool_id and tool_id in self._plugin_paths:
            path = self._plugin_paths[tool_id]
        else:
            if not filename.endswith((".yaml", ".yml")):
                filename += ".yaml"
            path = os.path.join(self.plugins_dir, filename)
            
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        self.load_plugins()
        return True

    def delete_plugin(self, tool_id: str) -> bool:
        if tool_id not in self._plugin_paths:
            return False
        path = self._plugin_paths[tool_id]
        if os.path.exists(path):
            os.remove(path)
            self.load_plugins()
            return True
        return False

    def export_plugin_template(self) -> str:
        template = {
            "name": "My Tool",
            "id": "my_tool_1.0",
            "version": "1.0.0",
            "category": "Processing",
            "description": "Description of what this tool does",
            "author": "Your Name",
            "license": "MIT",
            "tags": ["genomics"],
            "command": "my_tool --input {input_file} --output {output_file} --threads {threads}",
            "runtime": {
                "type": "system",
            },
            "params": {
                "threads": {
                    "type": "int",
                    "default": 4,
                    "label": "CPU Threads",
                    "description": "Number of CPU threads",
                    "min": 1,
                    "max": 128,
                    "category": "Performance",
                },
            },
            "inputs": {
                "input_file": {
                    "type": "file",
                    "extensions": [".bam"],
                    "label": "Input BAM",
                    "required": True,
                },
            },
            "outputs": {
                "output_file": {
                    "type": "file",
                    "extensions": [".vcf"],
                    "label": "Output VCF",
                },
            },
            "container": "docker://myimage:latest",
        }
        return yaml.dump(template, default_flow_style=False, sort_keys=False)