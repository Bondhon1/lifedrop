<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file --><!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file --><!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

- [x] Verify that the copilot-instructions.md file in the .github directory is created. (recreated after scaffolding)

- [x] Verify that the copilot-instructions.md file in the .github directory is created. (created fresh copy)- [x] Verify that the copilot-instructions.md file in the .github directory is created. (created fresh copy)

- [x] Clarify Project Requirements (targeting Next.js 14 full-stack TS, Tailwind, Prisma)

	<!-- Ask for project type, language, and frameworks if not specified. Skip if already provided. -->



- [x] Scaffold the Project (ran create-next-app with Tailwind, app router, src dir)- [x] Clarify Project Requirements (targeting Next.js 14 full-stack TS, Tailwind, Prisma)- [x] Clarify Project Requirements (targeting Next.js 14 full-stack TS, Tailwind, Prisma)

	<!--

	Ensure that the previous step has been marked as completed.	<!-- Ask for project type, language, and frameworks if not specified. Skip if already provided. -->	<!-- Ask for project type, language, and frameworks if not specified. Skip if already provided. -->

	Call project setup tool with projectType parameter.

	Run scaffolding command to create project files and folders.

	Use '.' as the working directory.

	If no appropriate projectType is available, search documentation using available tools.- [ ] Scaffold the Project- [ ] Scaffold the Project

	Otherwise, create the project structure manually using available file creation tools.

	-->	<!--	<!--



- [ ] Customize the Project	Ensure that the previous step has been marked as completed.	Ensure that the previous step has been marked as completed.

	<!--

	Verify that all previous steps have been completed successfully and you have marked the step as completed.	Call project setup tool with projectType parameter.	Call project setup tool with projectType parameter.

	Develop a plan to modify codebase according to user requirements.

	Apply modifications using appropriate tools and user-provided references.	Run scaffolding command to create project files and folders.	Run scaffolding command to create project files and folders.

	Skip this step for "Hello World" projects.

	-->	Use '.' as the working directory.	Use '.' as the working directory.



- [ ] Install Required Extensions	If no appropriate projectType is available, search documentation using available tools.	If no appropriate projectType is available, search documentation using available tools.

	<!-- ONLY install extensions provided mentioned in the get_project_setup_info. Skip this step otherwise and mark as completed. -->

	Otherwise, create the project structure manually using available file creation tools.	Otherwise, create the project structure manually using available file creation tools.

- [ ] Compile the Project

	<!--	-->	-->

	Verify that all previous steps have been completed.

	Install any missing dependencies.

	Run diagnostics and resolve any issues.

	Check for markdown files in project folder for relevant instructions on how to do this.- [ ] Customize the Project- [ ] Customize the Project

	-->

	<!--	<!--

- [ ] Create and Run Task

	<!--	Verify that all previous steps have been completed successfully and you have marked the step as completed.	Verify that all previous steps have been completed successfully and you have marked the step as completed.

	Verify that all previous steps have been completed.

	Check https://code.visualstudio.com/docs/debugtest/tasks to determine if the project needs a task. If so, use the create_and_run_task to create and launch a task based on package.json, README.md, and project structure.	Develop a plan to modify codebase according to user requirements.	Develop a plan to modify codebase according to user requirements.

	Skip this step otherwise.

	 -->	Apply modifications using appropriate tools and user-provided references.	Apply modifications using appropriate tools and user-provided references.



- [ ] Launch the Project	Skip this step for "Hello World" projects.	Skip this step for "Hello World" projects.

	<!--

	Verify that all previous steps have been completed.	-->	-->

	Prompt user for debug mode, launch only if confirmed.

	 -->



- [ ] Ensure Documentation is Complete- [ ] Install Required Extensions- [ ] Install Required Extensions

	<!--

	Verify that all previous steps have been completed.	<!-- ONLY install extensions provided mentioned in the get_project_setup_info. Skip this step otherwise and mark as completed. -->	<!-- ONLY install extensions provided mentioned in the get_project_setup_info. Skip this step otherwise and mark as completed. -->

	Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.

	Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.

	 -->

- [ ] Compile the Project- [ ] Compile the Project

<!--

## Execution Guidelines	<!--	<!--

PROGRESS TRACKING:

- If any tools are available to manage the above todo list, use it to track progress through this checklist.	Verify that all previous steps have been completed.	Verify that all previous steps have been completed.

- After completing each step, mark it complete and add a summary.

- Read current todo list status before starting each new step.	Install any missing dependencies.	Install any missing dependencies.



COMMUNICATION RULES:	Run diagnostics and resolve any issues.	Run diagnostics and resolve any issues.

- Avoid verbose explanations or printing full command outputs.

- If a step is skipped, state that briefly (e.g. "No extensions needed").	Check for markdown files in project folder for relevant instructions on how to do this.	Check for markdown files in project folder for relevant instructions on how to do this.

- Do not explain project structure unless asked.

- Keep explanations concise and focused.	-->	-->



DEVELOPMENT RULES:

- Use '.' as the working directory unless user specifies otherwise.

- Avoid adding media or external links unless explicitly requested.- [ ] Create and Run Task- [ ] Create and Run Task

- Use placeholders only with a note that they should be replaced.

- Use VS Code API tool only for VS Code extension projects.	<!--	<!--

- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in Visual Studio again.

- If the project setup information has additional rules, follow them strictly.	Verify that all previous steps have been completed.	Verify that all previous steps have been completed.



FOLDER CREATION RULES:	Check https://code.visualstudio.com/docs/debugtest/tasks to determine if the project needs a task. If so, use the create_and_run_task to create and launch a task based on package.json, README.md, and project structure.	Check https://code.visualstudio.com/docs/debugtest/tasks to determine if the project needs a task. If so, use the create_and_run_task to create and launch a task based on package.json, README.md, and project structure.

- Always use the current directory as the project root.

- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.	Skip this step otherwise.	Skip this step otherwise.

- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.

- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.	 -->	 -->



EXTENSION INSTALLATION RULES:

- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.

- [ ] Launch the Project- [ ] Launch the Project

PROJECT CONTENT RULES:

- If the user has not specified project details, assume they want a "Hello World" project as a starting point.	<!--	<!--

- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.

- Avoid generating images, videos, or any other media files unless explicitly requested.	Verify that all previous steps have been completed.	Verify that all previous steps have been completed.

- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.

- Ensure all generated components serve a clear purpose within the user's requested workflow.	Prompt user for debug mode, launch only if confirmed.	Prompt user for debug mode, launch only if confirmed.

- If a feature is assumed but not confirmed, prompt the user for clarification before including it.

- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.	 -->	 -->



TASK COMPLETION RULES:

- Your task is complete when:

  - Project is successfully scaffolded and compiled without errors- [ ] Ensure Documentation is Complete- [ ] Ensure Documentation is Complete

  - copilot-instructions.md file in the .github directory exists in the project

  - README.md file exists and is up to date	<!--	<!--

  - User is provided with clear instructions to debug/launch the project

	Verify that all previous steps have been completed.	Verify that all previous steps have been completed.

Before starting a new task in the above plan, update progress in the plan.

-->	Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.	Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.

- Work through each checklist item systematically.

- Keep communication concise and focused.	Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.	Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.

- Follow development best practices.

	 -->	 -->



<!--<!--

## Execution Guidelines## Execution Guidelines

PROGRESS TRACKING:PROGRESS TRACKING:

- If any tools are available to manage the above todo list, use it to track progress through this checklist.- If any tools are available to manage the above todo list, use it to track progress through this checklist.

- After completing each step, mark it complete and add a summary.- After completing each step, mark it complete and add a summary.

- Read current todo list status before starting each new step.- Read current todo list status before starting each new step.



COMMUNICATION RULES:COMMUNICATION RULES:

- Avoid verbose explanations or printing full command outputs.- Avoid verbose explanations or printing full command outputs.

- If a step is skipped, state that briefly (e.g. "No extensions needed").- If a step is skipped, state that briefly (e.g. "No extensions needed").

- Do not explain project structure unless asked.- Do not explain project structure unless asked.

- Keep explanations concise and focused.- Keep explanations concise and focused.



DEVELOPMENT RULES:DEVELOPMENT RULES:

- Use '.' as the working directory unless user specifies otherwise.- Use '.' as the working directory unless user specifies otherwise.

- Avoid adding media or external links unless explicitly requested.- Avoid adding media or external links unless explicitly requested.

- Use placeholders only with a note that they should be replaced.- Use placeholders only with a note that they should be replaced.

- Use VS Code API tool only for VS Code extension projects.- Use VS Code API tool only for VS Code extension projects.

- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in Visual Studio again.- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in Visual Studio again.

- If the project setup information has additional rules, follow them strictly.- If the project setup information has additional rules, follow them strictly.



FOLDER CREATION RULES:FOLDER CREATION RULES:

- Always use the current directory as the project root.- Always use the current directory as the project root.

- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.

- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.

- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.



EXTENSION INSTALLATION RULES:EXTENSION INSTALLATION RULES:

- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.



PROJECT CONTENT RULES:PROJECT CONTENT RULES:

- If the user has not specified project details, assume they want a "Hello World" project as a starting point.- If the user has not specified project details, assume they want a "Hello World" project as a starting point.

- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.

- Avoid generating images, videos, or any other media files unless explicitly requested.- Avoid generating images, videos, or any other media files unless explicitly requested.

- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.

- Ensure all generated components serve a clear purpose within the user's requested workflow.- Ensure all generated components serve a clear purpose within the user's requested workflow.

- If a feature is assumed but not confirmed, prompt the user for clarification before including it.- If a feature is assumed but not confirmed, prompt the user for clarification before including it.

- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.



TASK COMPLETION RULES:TASK COMPLETION RULES:

- Your task is complete when:- Your task is complete when:

  - Project is successfully scaffolded and compiled without errors  - Project is successfully scaffolded and compiled without errors

  - copilot-instructions.md file in the .github directory exists in the project  - copilot-instructions.md file in the .github directory exists in the project

  - README.md file exists and is up to date  - README.md file exists and is up to date

  - User is provided with clear instructions to debug/launch the project  - User is provided with clear instructions to debug/launch the project



Before starting a new task in the above plan, update progress in the plan.Before starting a new task in the above plan, update progress in the plan.

-->-->

- Work through each checklist item systematically.- Work through each checklist item systematically.

- Keep communication concise and focused.- Keep communication concise and focused.

- Follow development best practices.- Follow development best practices.

