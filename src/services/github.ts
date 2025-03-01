
type Branch = {
    name: string;
    commit: {
        sha: string;
        url: string;
    }
}

const fetchGithubApi = (repositoryUrl: string, repositoryToken?: string) => {
    const baseUrl = "https://api.github.com/repos/" + repositoryUrl.replace("https://github.com/", "").replace(".git", "")
    const headers = !!repositoryToken ? { Authorization: `Bearer ${repositoryToken}` } : undefined
    return <T>(resourceUrl: string, data: T) => fetch(baseUrl + resourceUrl, { headers, body: data ? JSON.stringify(data) : undefined })
        .then(async (response) => ({ data: await response.json(), error: null }))
        .catch((error) => ({ error, data: null }))
} 

export const getBranches = async (input: {
    repositoryUrl: string;
    repositoryToken?: string;
}) => {
    return await fetchGithubApi(input.repositoryUrl, input.repositoryToken)
        ("/branches", null )
}
