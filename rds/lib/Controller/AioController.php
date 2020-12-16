<?php

namespace OCA\RDS\Controller;

use OCP\IRequest;
use OCP\AppFramework\Controller;
use \OCA\RDS\Service\MetadataService;
use \OCA\RDS\Service\ResearchService;

class AioController extends Controller
{
    private $userId;
    private $metadata;
    private $research;

    use Errors;

    public function __construct($AppName, IRequest $request, MetadataService $metadata, ResearchService $research, $userId)
    {
        parent::__construct($AppName, $request);
        $this->userId = $userId;
        $this->metadata = $metadata;
        $this->research = $research;
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
            $this->research->createProjectForResearch($this->userId, $id);
            $this->metadata->triggerUpdate($this->userId, $id);
            $this->research->updateFiles($this->userId, $id);
            $this->research->publish($this->userId, $id);
            return true;
        });
    }
}
