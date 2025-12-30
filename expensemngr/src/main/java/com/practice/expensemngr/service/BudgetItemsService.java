package io.saadmughal.assignment05.service;

import io.saadmughal.assignment05.dto.BudgetItemsDTO;
import io.saadmughal.assignment05.entity.BudgetItems;
import io.saadmughal.assignment05.repository.BudgetItemsRepository;
import io.saadmughal.assignment05.vo.BudgetItemsQueryVO;
import io.saadmughal.assignment05.vo.BudgetItemsUpdateVO;
import io.saadmughal.assignment05.vo.BudgetItemsVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class BudgetItemsService {

    @Autowired
    private BudgetItemsRepository budgetItemsRepository;

    public Long save(BudgetItemsVO vO) {
        BudgetItems bean = new BudgetItems();
        BeanUtils.copyProperties(vO, bean);
        bean = budgetItemsRepository.save(bean);
        return bean.getId();
    }

    public void delete(Long id) {
        budgetItemsRepository.deleteById(id);
    }

    public void update(Long id, BudgetItemsUpdateVO vO) {
        BudgetItems bean = requireOne(id);
        BeanUtils.copyProperties(vO, bean);
        budgetItemsRepository.save(bean);
    }

    public BudgetItemsDTO getById(Long id) {
        BudgetItems original = requireOne(id);
        return toDTO(original);
    }

    public Page<BudgetItemsDTO> query(BudgetItemsQueryVO vO) {
        throw new UnsupportedOperationException();
    }

    private BudgetItemsDTO toDTO(BudgetItems original) {
        BudgetItemsDTO bean = new BudgetItemsDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private BudgetItems requireOne(Long id) {
        return budgetItemsRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}
