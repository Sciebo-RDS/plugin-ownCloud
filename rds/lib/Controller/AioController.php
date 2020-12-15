<?php

namespace OCA\RDS\Controller;

use OCP\IRequest;
use OCP\AppFramework\Controller;
use \OCA\RDS\Controller\ResearchController;
use \OCA\RDS\Controller\MetadataController;
use \OCA\RDS\Service\ResearchService;

class AioController extends Controller
{
    private $userId;
    private $metadataController;
    private $researchController;
    private $researchService;

    use Errors;

    public function __construct($AppName, IRequest $request, metadataController $metadata, ResearchController $research, $userId, ResearchService $researchService)
    {
        parent::__construct($AppName, $request);
        $this->userId = $userId;
        $this->metadataController = $metadata;
        $this->researchController = $research;
        $this->researchService = $researchService;
    }

    /**
     * Trigger RDS System to synchronize metadata and files in services
     *
     * @param integer $id have to be a researchIndex
     * @return string returns True if success. Otherwise False
     *
     * @NoAdminRequired
     */
    public function triggerSync($id)
    {
        return $this->handleNotFound(function () use ($id) {
            # TODO: Bug here from filesTrigger, and createProject not registering the project in research
            $this->researchService->createProjectForResearch($this->userId, $id);
            $this->metadataController->triggerMetadata($id);
            $this->researchController->filesTrigger($id);
            $this->researchController->publish($id);
            return true;
        });
    }
}
