<?php

namespace OCA\RDS\Controller;

use OCP\IRequest;
use OCP\AppFramework\Controller;
use \OCA\RDS\Controller\ResearchController;
use \OCA\RDS\Controller\MetadataController;


class AioController extends Controller
{
    private $userId;
    private $metadataController;
    private $researchController;

    use Errors;

    public function __construct($AppName, IRequest $request, metadataController $metadata, ResearchController $research, $userId)
    {
        parent::__construct($AppName, $request);
        $this->userId = $userId;
        $this->metadataController = $metadata;
        $this->researchController = $research;
    }

    /**
     * Trigger RDS System to synchronize metadata and files in services
     *
     * @param integer $id
     * @return string returns True if success. Otherwise False
     *
     * @NoAdminRequired
     */
    public function triggerSync($id)
    {
        return $this->handleNotFound(function () use ($id) {
            $this->metadataController->triggerMetadata($id);
            $this->researchController->filesTrigger($id);
            $this->researchController->publish($id);
            return TRUE;
        });
    }
}
