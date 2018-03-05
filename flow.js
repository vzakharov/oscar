module.exports = async (a) => {
    with (a) {
        api.url = 'https://smartcat.ai/api/integration/v1/'
    
        put("Hey, I’m Oscar, the Smartcat-augmenting robot.")
    
        vars.firstName = await read("And you must be ...?")
    
        put("Nice to meet you, $firstName!")
    
        put("Now let’s connect to your Smartcat account. Do you know your API credentials?")
        
        await choose([
            "Yes",  getCreds,
            "No", () => {}
        ])
        
        async function getCreds() {
            
            Object.assign(api, require('./credentials.json').smartcat)
            // Object.assign(api, {
            //     username: await read("What’s your API username?"),
            //     password: await read("And the password? (NB! Make sure to delete the message after sending!)")
            // })
    
            put("One second, let’s see if it works...")
            vars.account = await api.get('account')
    
            put("Yay, account *$account.name* successfully loaded!")
    
            await getProjects({initial: true})
        }
    
        async function getProjects(options) {
    
            if (options.initial) {
                put("Now let’s fetch your projects...") /// Shown the first time
            } else {
                put("Fetching your projects...") /// Shown afterwards
            }
    
            let projects = (await api.get('project/list')).reverse()
    
            put("Here you go:")
            await choose([
                "[Create new project]", newProject,
                "[Do something else]", mainMenu,
                projects, 'name', showProject
            ])
        }
    
        async function mainMenu() {

        }

        async function newProject() {

        }

        async function showProject(p) {
    
            put("Fetching project *$name*", p)
    
            put("Done! Here’s some project info:")
            
            [
                ["Name", p.name],
                ["Source language", p.sourceLanguage],
                ["Target language(s)", p.targetLanguages],
                ["Deadline", p.deadline],
                ["Created at", p.creationDate],
                ["Status", p.status]
            ].forEach(pair => 
                put(`${format(pair[0])}: ${pair[1]}`)
            )

            put("Completion percentage by stages:")
            let stages = p.workflowStages
            let stageTitles = {
                translation: "Translation",
                editing: "Editing",
                proofreading: "Proofreading",
                postediting: "Post-editing"
            }
    
            stages.forEach(stage => {
                let {stageType, stageProgress} = stage
                put(`${stageTitles[stageType]}: *${stageProgress}%*`)
            })
    
            put("The project contains the following documents:")    /// Lines after this one indicate specific properties displayed in the document list, e.g. “Document1 (to JA, unassigned, 500/1000 words completed)”
    
            let docs = p.documents
    
            docs.forEach((d) => {
                d.wordsCompleted = d.workflowStages.map(stage => stage.wordsTranslated).join("/")
                put("*$name* — to $targetLanguage, $status, $wordsCompleted of $totalWords completed", d)
            })
    
            projectMenu()
    
            async function projectMenu() {
                put("What do you want to do now?")
    
                await choose([
                    "Auto-assign translators from my team", () => {},
                    "Go back to projects", getProjects,
                    "Deal with a specific doc:", async () => {
                        put("Which one?")
                        await choose([
                            docs, 'name', getDoc,
                            "[Back to project menu]", projectMenu,
                            "[Back to all projects]", getProjects
                        ])
                    },
                    docs, 'name', getDoc
                ])
            }
    
            async function getDoc() {
                
            }
    
        }   
    }


}