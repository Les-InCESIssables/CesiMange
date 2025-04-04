import { Router, Request, Response } from 'express';
import { BaseMetier } from '../../metier/base/BaseMetier';

export class BaseController<DTO, CritereDTO>
{
    protected Router: Router;
    protected Metier: BaseMetier<DTO, CritereDTO>;

    constructor (pMetier: BaseMetier<DTO, CritereDTO>)
    {
        this.Router = Router();
        this.Metier = pMetier;
        this.initializeRoutes();
    }

    protected initializeRoutes(): void
    {
        // GET / - Récupérer tous les éléments
        this.Router.get('/', this.getAllItems);

        // GET /:id - Récupérer un élément par son ID
        this.Router.get('/:id', this.getItem);

        // POST / - Créer un nouvel élément
        this.Router.post('/', this.createItem);

        // PUT /:id - Mettre à jour un élément existant
        this.Router.put('/:id', this.updateItem);

        // DELETE /:id - Supprimer un élément
        this.Router.delete('/:id', this.deleteItem);
    }

    /**
     *
     * @param req
     * @param res
     */
    protected getAllItems = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            let lCritere = req.body as CritereDTO;

            // Validation des données
            try
            {
                this.validateGetItems(lCritere);
                lCritere = this.beforeGetItems(lCritere);
            } catch (validationError)
            {
                res.status(400).json({
                    error: validationError instanceof Error ? validationError.message : 'Données de recherche invalides'
                });
                return;
            }

            const items = await this.Metier.getItems(lCritere);
            res.status(200).json(items);
        } catch (error)
        {
            this.handleError(error, 'getAllItems');
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
            });
        }
    };

    protected getItem = async (pReq: Request, pRes: Response): Promise<void> =>
    {
        try
        {
            let lCritere = pReq.body as CritereDTO;

            // cm - Validation des données
            try
            {
                await this.validateGetItem(lCritere);
                lCritere = this.beforeGetItem(lCritere);
            } catch (validationError)
            {
                pRes.status(400).json({
                    error: validationError instanceof Error ? validationError.message : 'Identifiant invalide'
                });
                return;
            }

            let lItem: DTO = await this.Metier.getItem(lCritere);
            if (lItem && lItem != {} as DTO)
            {
                // cm - Action apres la recuperation de l'item
                lItem = await this.afterGetItem(lItem, pRes);
                pRes.status(200).json(lItem)
            }
            else
                pRes.status(404).json({ error: 'Élément non trouvé' });



        } catch (pError)
        {
            this.handleError(pError, 'getItem');
            pRes.status(500).json({
                error: pError instanceof Error ? pError.message : 'Une erreur inconnue est survenue',
            });
        }
    };

    protected createItem = async (pReq: Request, pRes: Response): Promise<void> =>
    {
        try
        {
            let lItemDTO = pReq.body as DTO;

            // Validation des données
            try
            {
                await this.validateCreateItem(lItemDTO);
                lItemDTO = await this.beforeCreateItem(lItemDTO);
            } catch (validationError)
            {
                pRes.status(400).json({
                    error: validationError instanceof Error ? validationError.message : 'Données invalides pour la création'
                });
                return;
            }

            const lCreatedItem = await this.Metier.createItem(lItemDTO);
            pRes.status(201).json(lCreatedItem);
        } catch (error)
        {
            this.handleError(error, 'createItem');
            pRes.status(500).json({
                error: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création',
            });
        }
    };

    protected updateItem = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            let itemDTO = req.body as DTO;
            const critere = { id: req.params.id } as unknown as CritereDTO;

            // Validation des données
            try
            {
                await this.validateUpdateItem(itemDTO, critere);
                itemDTO = await this.beforeUpdateItem(itemDTO, critere);
            } catch (validationError)
            {
                res.status(400).json({
                    error: validationError instanceof Error ? validationError.message : 'Données invalides pour la mise à jour'
                });
                return;
            }

            const updatedItem = await this.Metier.updateItem(itemDTO, critere);
            if (!updatedItem)
            {
                res.status(404).json({ error: 'Élément non trouvé' });
                return;
            }
            res.status(200).json(updatedItem);
        } catch (error)
        {
            this.handleError(error, 'updateItem');
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour',
            });
        }
    };

    protected deleteItem = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            let lCritere = req.body as CritereDTO;

            // Validation des données
            try
            {
                await this.validateDeleteItem(lCritere);
                lCritere = await this.beforeDeleteItem(lCritere);
            } catch (validationError)
            {
                res.status(400).json({
                    error: validationError instanceof Error ? validationError.message : 'Identifiant invalide pour la suppression'
                });
                return;
            }

            const success = await this.Metier.deleteItem(lCritere);

            if (success)
                await this.afterDeleteItem(lCritere);

            success ? res.status(204).send() : res.status(404).json({ error: 'Élément non trouvé' });
        } catch (error)
        {
            this.handleError(error, 'deleteItem');
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression',
            });
        }
    };

    public getRouter(): Router
    {
        return this.Router;
    }

    /**
     * Gestion des erreurs
     */
    protected handleError(error: any, methodName: string): void
    {
        console.error(`Erreur dans ${methodName}:`, error);
        // Logique spécifique de gestion des erreurs
    }

    protected validateGetItems(pCritereDTO: CritereDTO): void
    {
        // À implémenter dans les classes dérivées
    }

    protected async validateGetItem(pCritereDTO: CritereDTO): Promise<void>
    {
        // À implémenter dans les classes dérivées
    }

    protected async validateCreateItem(pDTO: DTO): Promise<void>
    {
        // À implémenter dans les classes dérivées
    }

    protected async validateUpdateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<void>
    {
        // À implémenter dans les classes dérivées
    }

    protected async validateDeleteItem(pCritereDTO: CritereDTO): Promise<void>
    {
        // À implémenter dans les classes dérivées
    }

    protected beforeGetItems(pCritereDTO: CritereDTO): CritereDTO
    {
        return pCritereDTO;
    }

    protected beforeGetItem(pCritereDTO: CritereDTO): CritereDTO
    {
        return pCritereDTO;
    }

    protected async beforeCreateItem(pDTO: DTO): Promise<DTO>
    {
        return pDTO; // Par défaut, retourne l'objet non modifié
    }

    protected async beforeUpdateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        return pDTO; // Par défaut, retourne l'objet non modifié
    }

    protected async beforeDeleteItem(pCritereDTO: CritereDTO): Promise<CritereDTO>
    {
        return pCritereDTO;
    }

    protected afterGetItems(pDTOs: DTO[]): DTO[]
    {
        return pDTOs;
    }

    protected async afterGetItem(pDTO: DTO, pRes?: Response): Promise<DTO>
    {
        return pDTO;
    }

    protected async afterCreateItem(pDTO: DTO): Promise<DTO>
    {
        return pDTO; // Par défaut, retourne l'objet non modifié
    }

    protected async afterUpdateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        return pDTO; // Par défaut, retourne l'objet non modifié
    }

    protected async afterDeleteItem(pCritereDTO: CritereDTO): Promise<void>
    {
        // À implémenter dans les classes dérivées
    }
}