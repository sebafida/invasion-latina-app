#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Application mobile premium pour Invasion Latina (événement nightlife majeur en Belgique).
  Features: Events & Ticketing, Live DJ Request System, VIP Table Booking, Merchandising, Social & Media.
  Support 2000 utilisateurs concurrents, multi-lingue (FR/ES/NL), backend real-time.
  Note: Boutique merchandising en suspend pour l'instant.

backend:
  - task: "API endpoint /api/events/next - Get next upcoming event"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "User reported 400 Bad Request error on home screen after login"
      - working: true
        agent: "main"
        comment: "Created missing /api/events/next endpoint. Returns next upcoming event or mock data if none exists. Tested with curl - returns valid JSON response with event data including name, date, venue, lineup, ticket categories."

  - task: "User Authentication - Login/Logout"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "user"
        comment: "Login works correctly with credentials admin@invasionlatina.be / admin123"

frontend:
  - task: "Home screen - Display event countdown and info"
    implemented: true
    working: false
    file: "/app/frontend/app/(tabs)/home.tsx"
    stuck_count: 1
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "Shows error toast due to 400 Bad Request when calling /api/events/next"
      - working: true
        agent: "main"
        comment: "Backend endpoint fixed. Frontend should now successfully load event data. Needs frontend testing to confirm."

  - task: "User Authentication Flow - Login screen"
    implemented: true
    working: true
    file: "/app/frontend/app/auth/login.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "user"
        comment: "Login flow working, user can authenticate successfully"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "API endpoint /api/events/next - Get next upcoming event"
    - "Home screen - Display event countdown and info"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Bug P0 résolu: L'endpoint /api/events/next manquait dans le backend.
      
      Changements effectués:
      - Ajouté endpoint GET /api/events/next dans /app/backend/server.py
      - Retourne le prochain événement upcoming (event_date >= now, status=published)
      - Si aucun événement upcoming, retourne le plus récent
      - Si aucun événement dans la DB, retourne des données mock pour "Invasion Latina - Summer Edition"
      - Backend redémarré et testé avec curl: fonctionne correctement
      
      Prochaine étape:
      - Tester le backend complet avec deep_testing_backend_v2
      - Vérifier que le frontend charge maintenant les données correctement
      
      Credentials de test: admin@invasionlatina.be / admin123