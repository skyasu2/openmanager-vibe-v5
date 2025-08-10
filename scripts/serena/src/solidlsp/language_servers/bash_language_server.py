"""
Provides Bash specific instantiation of the LanguageServer class using bash-language-server.
Contains various configurations and settings specific to Bash scripting.
"""

import logging
import os
import pathlib
import shutil
import threading

from solidlsp import ls_types
from solidlsp.language_servers.common import RuntimeDependency, RuntimeDependencyCollection
from solidlsp.ls import SolidLanguageServer
from solidlsp.ls_config import LanguageServerConfig
from solidlsp.ls_logger import LanguageServerLogger
from solidlsp.lsp_protocol_handler.lsp_types import InitializeParams
from solidlsp.lsp_protocol_handler.server import ProcessLaunchInfo
from solidlsp.settings import SolidLSPSettings


class BashLanguageServer(SolidLanguageServer):
    """
    Provides Bash specific instantiation of the LanguageServer class using bash-language-server.
    Contains various configurations and settings specific to Bash scripting.
    """

    def __init__(
        self, config: LanguageServerConfig, logger: LanguageServerLogger, repository_root_path: str, solidlsp_settings: SolidLSPSettings
    ):
        """
        Creates a BashLanguageServer instance. This class is not meant to be instantiated directly.
        Use LanguageServer.create() instead.
        """
        bash_lsp_executable_path = self._setup_runtime_dependencies(logger, config, solidlsp_settings)
        super().__init__(
            config,
            logger,
            repository_root_path,
            ProcessLaunchInfo(cmd=bash_lsp_executable_path, cwd=repository_root_path),
            "bash",
            solidlsp_settings,
        )
        self.server_ready = threading.Event()
        self.initialize_searcher_command_available = threading.Event()

    @classmethod
    def _setup_runtime_dependencies(
        cls, logger: LanguageServerLogger, config: LanguageServerConfig, solidlsp_settings: SolidLSPSettings
    ) -> str:
        """
        Setup runtime dependencies for Bash Language Server and return the command to start the server.
        """
        # Verify both node and npm are installed
        is_node_installed = shutil.which("node") is not None
        assert is_node_installed, "node is not installed or isn't in PATH. Please install NodeJS and try again."
        is_npm_installed = shutil.which("npm") is not None
        assert is_npm_installed, "npm is not installed or isn't in PATH. Please install npm and try again."

        deps = RuntimeDependencyCollection(
            [
                RuntimeDependency(
                    id="bash-language-server",
                    description="bash-language-server package",
                    command="npm install --prefix ./ bash-language-server@5.6.0",
                    platform_id="any",
                ),
            ]
        )

        # Install bash-language-server if not already installed
        bash_ls_dir = os.path.join(cls.ls_resources_dir(solidlsp_settings), "bash-lsp")
        bash_executable_path = os.path.join(bash_ls_dir, "node_modules", ".bin", "bash-language-server")

        # Handle Windows executable extension
        if os.name == "nt":
            bash_executable_path += ".cmd"

        if not os.path.exists(bash_executable_path):
            logger.log(f"Bash Language Server executable not found at {bash_executable_path}. Installing...", logging.INFO)
            deps.install(logger, bash_ls_dir)
            logger.log("Bash language server dependencies installed successfully", logging.INFO)

        if not os.path.exists(bash_executable_path):
            raise FileNotFoundError(
                f"bash-language-server executable not found at {bash_executable_path}, something went wrong with the installation."
            )
        return f"{bash_executable_path} start"

    @staticmethod
    def _get_initialize_params(repository_absolute_path: str) -> InitializeParams:
        """
        Returns the initialize params for the Bash Language Server.
        """
        root_uri = pathlib.Path(repository_absolute_path).as_uri()
        initialize_params = {
            "locale": "en",
            "capabilities": {
                "textDocument": {
                    "synchronization": {"didSave": True, "dynamicRegistration": True},
                    "completion": {"dynamicRegistration": True, "completionItem": {"snippetSupport": True}},
                    "definition": {"dynamicRegistration": True},
                    "references": {"dynamicRegistration": True},
                    "documentSymbol": {
                        "dynamicRegistration": True,
                        "hierarchicalDocumentSymbolSupport": True,
                        "symbolKind": {"valueSet": list(range(1, 27))},
                    },
                    "hover": {"dynamicRegistration": True, "contentFormat": ["markdown", "plaintext"]},
                    "signatureHelp": {"dynamicRegistration": True},
                    "codeAction": {"dynamicRegistration": True},
                },
                "workspace": {
                    "workspaceFolders": True,
                    "didChangeConfiguration": {"dynamicRegistration": True},
                    "symbol": {"dynamicRegistration": True},
                },
            },
            "processId": os.getpid(),
            "rootPath": repository_absolute_path,
            "rootUri": root_uri,
            "workspaceFolders": [
                {
                    "uri": root_uri,
                    "name": os.path.basename(repository_absolute_path),
                }
            ],
        }
        return initialize_params

    def _start_server(self):
        """
        Starts the Bash Language Server, waits for the server to be ready and yields the LanguageServer instance.
        """

        def register_capability_handler(params):
            assert "registrations" in params
            for registration in params["registrations"]:
                if registration["method"] == "workspace/executeCommand":
                    self.initialize_searcher_command_available.set()
            return

        def execute_client_command_handler(params):
            return []

        def do_nothing(params):
            return

        def window_log_message(msg):
            self.logger.log(f"LSP: window/logMessage: {msg}", logging.INFO)
            # Check for bash-language-server ready signals
            message_text = msg.get("message", "")
            if "Analyzing" in message_text or "analysis complete" in message_text.lower():
                self.logger.log("Bash language server analysis signals detected", logging.INFO)
                self.server_ready.set()
                self.completions_available.set()

        self.server.on_request("client/registerCapability", register_capability_handler)
        self.server.on_notification("window/logMessage", window_log_message)
        self.server.on_request("workspace/executeClientCommand", execute_client_command_handler)
        self.server.on_notification("$/progress", do_nothing)
        self.server.on_notification("textDocument/publishDiagnostics", do_nothing)

        self.logger.log("Starting Bash server process", logging.INFO)
        self.server.start()
        initialize_params = self._get_initialize_params(self.repository_root_path)

        self.logger.log(
            "Sending initialize request from LSP client to LSP server and awaiting response",
            logging.INFO,
        )
        init_response = self.server.send.initialize(initialize_params)
        self.logger.log(f"Received initialize response from bash server: {init_response}", logging.DEBUG)

        # Enhanced capability checks for bash-language-server 5.6.0
        assert init_response["capabilities"]["textDocumentSync"] in [1, 2]  # Full or Incremental
        assert "completionProvider" in init_response["capabilities"]

        # Verify document symbol support is available
        if "documentSymbolProvider" in init_response["capabilities"]:
            self.logger.log("Bash server supports document symbols", logging.INFO)
        else:
            self.logger.log("Warning: Bash server does not report document symbol support", logging.WARNING)

        self.server.notify.initialized({})

        # Wait for server readiness with timeout
        self.logger.log("Waiting for Bash language server to be ready...", logging.INFO)
        if not self.server_ready.wait(timeout=3.0):
            # Fallback: assume server is ready after timeout
            self.logger.log("Timeout waiting for bash server ready signal, proceeding anyway", logging.WARNING)
            self.server_ready.set()
            self.completions_available.set()
        else:
            self.logger.log("Bash server initialization complete", logging.INFO)

    def request_document_symbols(
        self, relative_file_path: str, include_body: bool = False
    ) -> tuple[list[ls_types.UnifiedSymbolInformation], list[ls_types.UnifiedSymbolInformation]]:
        """
        Enhanced document symbol request with hybrid LSP + regex-based function detection for bash files.

        This method combines both LSP-based detection and regex-based detection to provide comprehensive
        function discovery. This dual approach is necessary because:

        1. bash-language-server (v5.6.0) has inconsistent function detection capabilities
        2. Some bash function syntaxes are not reliably detected by the LSP server
        3. Files may contain mixed function notation styles within the same file
        4. Different formatting or indentation can affect LSP detection

        The hybrid approach ensures maximum compatibility and comprehensive function discovery
        for reliable symbolic editing operations in Serena.
        """
        # First get symbols from the standard LSP approach
        lsp_all_symbols, lsp_root_symbols = super().request_document_symbols(relative_file_path, include_body)

        # Always run regex-based function detection for comprehensive coverage
        # This addresses bash-language-server limitations and ensures we catch all function patterns
        self.logger.log(f"Running hybrid function detection (LSP + regex) for {relative_file_path}", logging.DEBUG)

        regex_detected_functions = self._detect_bash_functions(relative_file_path, include_body)

        # Merge LSP and regex results, avoiding duplicates
        merged_all_symbols, merged_root_symbols = self._merge_function_detections(
            lsp_all_symbols, lsp_root_symbols, regex_detected_functions
        )

        # Log detection results for debugging
        lsp_functions = [s for s in lsp_all_symbols if s.get("kind") == 12]
        total_functions = [s for s in merged_all_symbols if s.get("kind") == 12]

        self.logger.log(
            f"Function detection for {relative_file_path}: LSP={len(lsp_functions)}, "
            f"Regex={len(regex_detected_functions)}, Total={len(total_functions)}",
            logging.INFO,
        )

        return merged_all_symbols, merged_root_symbols

    def _merge_function_detections(
        self,
        lsp_all_symbols: list[ls_types.UnifiedSymbolInformation],
        lsp_root_symbols: list[ls_types.UnifiedSymbolInformation],
        regex_detected_functions: list[ls_types.UnifiedSymbolInformation],
    ) -> tuple[list[ls_types.UnifiedSymbolInformation], list[ls_types.UnifiedSymbolInformation]]:
        """
        Merge LSP-detected symbols with regex-detected functions, avoiding duplicates.

        This method:
        1. Keeps all non-function symbols from LSP detection
        2. Keeps all LSP-detected functions (they have more accurate positioning)
        3. Adds regex-detected functions that weren't found by LSP
        4. Uses function names to detect duplicates

        Args:
            lsp_all_symbols: All symbols detected by LSP
            lsp_root_symbols: Root-level symbols detected by LSP
            regex_detected_functions: Functions detected by regex (all are root-level)

        Returns:
            Tuple of (merged_all_symbols, merged_root_symbols)

        """
        # Extract function names that LSP already detected
        lsp_function_names = set()
        for symbol in lsp_all_symbols:
            if symbol.get("kind") == 12:  # LSP Symbol Kind 12 = Function
                lsp_function_names.add(symbol["name"])

        # Start with all LSP symbols (both functions and non-functions)
        merged_all_symbols = lsp_all_symbols.copy()
        merged_root_symbols = lsp_root_symbols.copy()

        # Add regex-detected functions that weren't found by LSP
        added_functions = 0
        for regex_function in regex_detected_functions:
            function_name = regex_function["name"]

            # Only add if this function wasn't detected by LSP
            if function_name not in lsp_function_names:
                merged_all_symbols.append(regex_function)
                merged_root_symbols.append(regex_function)  # All regex functions are root-level
                added_functions += 1
                self.logger.log(f"Added regex-detected function '{function_name}' not found by LSP", logging.DEBUG)

        if added_functions > 0:
            self.logger.log(f"Merged {added_functions} additional functions from regex detection", logging.INFO)

        return merged_all_symbols, merged_root_symbols

    def _detect_bash_functions(self, relative_file_path: str, include_body: bool = False) -> list[ls_types.UnifiedSymbolInformation]:
        """
        Regex-based detection of bash functions as fallback when LSP doesn't provide them.
        """
        import re

        from solidlsp import ls_types

        try:
            # Read the file content directly from filesystem
            abs_path = os.path.join(self.repository_root_path, relative_file_path)
            with open(abs_path, encoding="utf-8") as f:
                file_content = f.read()
            lines = file_content.split("\n")

            detected_functions = []

            # Regex patterns for bash function definitions
            # Pattern 1: function name() { ... }
            # Pattern 2: name() { ... }
            function_patterns = [
                re.compile(r"^\s*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*\)\s*\{"),
                re.compile(r"^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*\)\s*\{"),
            ]

            for line_num, line in enumerate(lines):
                for pattern in function_patterns:
                    match = pattern.match(line)
                    if match:
                        func_name = match.group(1)

                        # Find the end of the function by matching braces
                        start_line = line_num
                        end_line = self._find_function_end(lines, start_line)

                        # Create location information
                        location = ls_types.Location(
                            uri=pathlib.Path(abs_path).as_uri(),
                            range={"start": {"line": start_line, "character": match.start(1)}, "end": {"line": end_line, "character": 0}},
                            absolutePath=abs_path,
                            relativePath=relative_file_path,
                        )

                        # Create the function symbol
                        func_symbol = ls_types.UnifiedSymbolInformation(
                            name=func_name,
                            kind=12,  # LSP Symbol Kind for Function
                            location=location,
                            range=location["range"],
                            selectionRange={
                                "start": {"line": start_line, "character": match.start(1)},
                                "end": {"line": start_line, "character": match.end(1)},
                            },
                            children=[],
                            parent=None,
                        )

                        # Add function body if requested
                        if include_body:
                            func_symbol["body"] = "\n".join(lines[start_line : end_line + 1])

                        detected_functions.append(func_symbol)
                        break

            return detected_functions

        except Exception as e:
            self.logger.log(f"Error in regex-based function detection for {relative_file_path}: {e}", logging.WARNING)
            return []

    def _find_function_end(self, lines: list[str], start_line: int) -> int:
        """
        Find the end line of a bash function by matching opening and closing braces.
        """
        brace_count = 0
        in_function = False

        for i in range(start_line, len(lines)):
            line = lines[i]

            # Count braces, handling basic cases
            for char in line:
                if char == "{":
                    brace_count += 1
                    in_function = True
                elif char == "}" and in_function:
                    brace_count -= 1
                    if brace_count == 0:
                        return i

        # Fallback: if we can't match braces properly, assume single line or small function
        return min(start_line + 10, len(lines) - 1)
