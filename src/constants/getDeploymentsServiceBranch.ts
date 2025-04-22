export const getDeploymentsServiceBranch = () =>
    process.env.DEPLOYMENTS_SERVICE_GIT_BRANCH ?? "master";
